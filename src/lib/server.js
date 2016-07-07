import { storeState, storeDispatch, storeSubscribe } from '../lib/reducers'
import { calcRecipeKeyString } from '../lib/dockerApps'

let status = 0

storeSubscribe(() => {
  status++
  console.log(`[server] status updated: ${status}`)
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
  facade.pid = docker.pid
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
    tasks: tasksFacade(storeState().tasks)
  } 
}

export default {

  status: () => {
    return { status }
  },

  get: () => {
    let f = facade()
    return f
  },
}

console.log('server module initialized')




