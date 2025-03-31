const profileID = 127; //Truus

import express from 'express'
import { Liquid } from 'liquidjs';
const app = express()

app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express()); 

app.use(express.urlencoded({extended: true}))

app.set('views', './views')

app.get('/', async function (request, response) {
  const storyResponse = await fetch('https://fdnd-agency.directus.app/items/tm_story/')    
  const storyResponseJSON = await storyResponse.json()

  const likedStoriesResponse = await fetch('https://fdnd-agency.directus.app/items/tm_liked_stories?filter={"profile":127}')    
  const likedStoriesResponseJSON = await likedStoriesResponse.json()

  const idsOfLikedStories = likedStoriesResponseJSON.data.map(like => {
    return like.story
  })

  const newArray = storyResponseJSON.data.map(story => {
    story.liked = idsOfLikedStories.includes(story.id)
    return story
  })

  response.render('index.liquid', {
    stories: newArray
  })
})

app.post('/like', async function (request, response) {
  await fetch('https://fdnd-agency.directus.app/items/tm_liked_stories/', {
    method: 'POST',
    body: JSON.stringify({
      story: request.body.story,
      profile: profileID
    }),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  response.redirect(303, '/')
})

app.post('/unlike', async function (request, response) {
  const likeForStoryResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_liked_stories/?filter={"_and":[{"profile":${profileID}},{"story":${request.body.story}}]}`)
  const likeForStoryResponseJSON = await likeForStoryResponse.json()
  const likeForStoryResponseID = likeForStoryResponseJSON.data[0].id
  
  await fetch(`https://fdnd-agency.directus.app/items/tm_liked_stories/${likeForStoryResponseID}`, {
    method: 'DELETE'
  });

  response.redirect(303, '/')
})

app.get('/stories/:id', async function (request, response) {
  const storyResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_story/?fields=animal,season,language,id,summary,slug,title,image,audio.id,audio.audio_file,audio.transcript_file&filter={"id":${request.params.id}}`)
  const storyResponseJSON = await storyResponse.json()

  response.render('story.liquid', {story: storyResponseJSON.data[0]})
})

app.set('port', process.env.PORT || 8000)
app.listen(app.get('port'), function () {
  console.log(`Application started on http://localhost:${app.get('port')}`)
})
