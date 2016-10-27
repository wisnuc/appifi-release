import child from 'child_process'
import Debug from 'debug'

const debug = Debug('system:server')

import { storeState, storeDispatch, storeSubscribe } from './reducers'
import { calcRecipeKeyString } from './dockerApps'
import { daemonStart, daemonStop, daemonStartOp, containerStart, containerStop, containerDelete,
  installedStart, installedStop, appInstall, appUninstall} from './docker'
import { mkfsBtrfsOperation } from './storage'


import network from './eth'
import { setFanScale, updateFanSpeed } from '../../system/barcelona'
import appstore from './appstore'
import timedate from './timedate'

let status = 0

const info = (text) => console.log(`[server] ${text}`)

storeSubscribe(() => {
  status++
  debug('status update', status)
})

const appstoreFacade = (appstore) => {

  if (appstore === null) return null

  if (appstore.status === 'LOADING') 
    return { status: 'LOADING' }

  if (appstore.status === 'ERROR')
    return { status: 'ERROR', code: appstore.code, message: appstore.message }

  let { recipes, repoMap } = appstore.result
  if (!repoMap) {
    return {
      status: 'LOADED',
      result: recipes
    }
  }

  // be careful. if recipes are cloned first, then cloned 
  // recipes' components won't be the key in the map any more !!!

  let appended = []

  recipes.forEach(recipe => {

    let components = []
    recipe.components.forEach(compo => {
      let repo = repoMap.get(compo)
      if (repo === undefined) repo = null
      components.push(Object.assign({}, compo, {repo}))
    })
    appended.push(Object.assign({}, recipe, {components}))
  }) 

  appended.forEach(recipe => recipe.key = calcRecipeKeyString(recipe)) 
  return {
    status: 'LOADED',
    result: appended
  }
}

const installedFacades = (installeds) => {

  if (!installeds) return null

  let facade = installeds.map(inst => Object.assign({}, inst, {
    container: undefined,
    containerIds: inst.containers.map(c => c.Id) 
  }))

  // remove containers property, dirty, is there a better way ??? TODO
  facade.forEach(f => f.containers = undefined)
  return facade
}

const dockerFacade = (docker) => {
  
  if (!docker) return null
  
  let facade = {}
  // facade.pid = docker.pid
  facade.volume = docker.volume
  
  if (docker.data) {
    facade = Object.assign({}, facade, docker.data, { 
      installeds: installedFacades(docker.computed.installeds)
    })
  }

  return facade
}

const tasksFacade = (tasks) => {

  if (!tasks || !tasks.length) return [] 
  return tasks.map(t => t.facade())
}

const facade = () => {

  return {
    status,
    config: storeState().serverConfig,
    storage: storeState().storage,
    docker: dockerFacade(storeState().docker),
    appstore: appstoreFacade(storeState().appstore),
    tasks: tasksFacade(storeState().tasks),
    network: storeState().network,
    timeDate: storeState().timeDate,
    barcelona: storeState().barcelona
  } 
}

const networkUpdate = async () => storeDispatch({
  type: 'NETWORK_UPDATE',
  data: (await network())
})

const timeDateUpdate = async () => storeDispatch({
  type: 'TIMEDATE_UPDATE',
  data: (await Promise.promisify(timedate)())
})

const shutdown = (cmd) =>
  setTimeout(() => {
    child.exec('echo "PWRD_LED 3" > /proc/BOARD_io', err => {})
    child.exec(`${cmd}`, err => {})
  }, 1000)

const systemReboot = async () => shutdown('reboot') 
const systemPowerOff = async () => shutdown('poweroff')

const operationAsync = async (req) => {

  info(`operation: ${req.operation}`)

  let f, args

  if (req && req.operation) {
    
    args = (req.args && Array.isArray(req.args)) ? req.args : []

    switch (req.operation) {
    case 'daemonStart':
      f = daemonStartOp
      break 
    case 'daemonStop':
      f = daemonStop
      break
    case 'containerStart':
      f = containerStart
      break
    case 'containerStop':
      f = containerStop
      break
    case 'containerDelete':
      f = containerDeleteCommand
      break
    case 'installedStart':
      f = installedStart
      break
    case 'installedStop':
      f = installedStop
      break
    case 'appInstall':
      f = appInstall
      break
    case 'appUninstall':
      f = appUninstall
      break
    case 'mkfs_btrfs':
      f = mkfsBtrfsOperation
      break
    case 'networkUpdate':
      f = networkUpdate
      break
    case 'barcelonaFanScaleUpdate':
      f = setFanScale
      break
    case 'barcelonaFanSpeedUpdate':
      f = updateFanSpeed
      break
    case 'timeDateUpdate':
      f = timeDateUpdate
      break
    case 'systemReboot':
      f = systemReboot
      break
    case 'systemPowerOff':
      f = systemPowerOff
      break
    case 'appstoreRefresh':
      f = appstore.reload
      break

    default:
      info(`operation not implemented, ${req.operation}`)
    }
  }

  if (f) {
    return await f(...args)
  }
  
  return null
}

export default {

  status: () => {
    return { status }
  },

  get: () => {
    let f = facade()
    return f
  },

  operation: (req, callback) => {
    operationAsync(req)
      .then(r => callback(null)) 
      .catch(e => callback(e))
  }
}

console.log('server module initialized')




