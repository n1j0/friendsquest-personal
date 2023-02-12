// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY,
            friendsQuestApi: process.env.FRIENDS_QUEST_API,
        }
    },
    vite: {
        optimizeDeps: {
            exclude: [
                'vue-demi',
                '@osm_borders',
            ],
        },
    }
})
