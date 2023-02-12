<script setup lang="ts">
import { countryCodeEmoji } from 'country-code-emoji'

const { firebaseWebApiKey, friendsQuestApi } = useRuntimeConfig()
const loggedIn = ref(false)
const email = ref('')
const password = ref('')
const footprints = ref([])
const myFootprints = ref([])
const views = ref({})
const reactions = ref({})
const countries = ref<any[]>([])
const calculateViews = (footprints: any[]) => {
    let total: number
    let avg: number

    total = footprints.reduce((acc, next: any) => acc + +next.viewCount, 0)
    avg = total / footprints.length

    views.value = {
        total,
        avg,
    }
}

const calculateReactions = (footprints: any[]) => {
    let total: number
    let avg: number

    total = footprints.reduce((acc, next: any) => acc + next.reactions.length, 0)
    avg = total / footprints.length

    reactions.value = {
        total,
        avg,
    }
}
const calculateCountries = (footprints: any[]) => {
    const countedCountries = footprints.reduce((acc, next: any) => {
        if (acc[next.country]) {
            acc[next.country]++
        } else {
            acc[next.country] = 1
        }
        return acc
    }, {})

    countries.value = Object.keys(countedCountries).map((country) => ({
        country,
        count: countedCountries[country],
    }))
}
const countryCodes = computed(() => {
    return countries.value.map((country: any) => country.country) as any
})
const error = ref('')

onMounted(() => {
    const authToken = localStorage.getItem('authToken')
    if (authToken) {
        loggedIn.value = true
        getData()
    }
    email.value = localStorage.getItem('email') || ''
})

const login = async () => {
    error.value = ''
    try {
        const data = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ firebaseWebApiKey }`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.value,
                    password: password.value,
                    returnSecureToken: true,
                }),
            },
        )
        if (!data.ok) {
            error.value = (await data.json()).error.message
            return
        }
        const authToken = (await data.json()).idToken
        if (authToken) {
            localStorage.setItem('authToken', authToken)
            localStorage.setItem('email', email.value)
            await getData()
            loggedIn.value = true
        } else {
            loggedIn.value = false
            localStorage.removeItem('authToken')
            localStorage.removeItem('email')
            footprints.value = []
        }
        password.value = ''
    } catch (error: any) {
        console.error(error.message)
    }
}

const logout = () => {
    loggedIn.value = false
    localStorage.removeItem('authToken')
    localStorage.removeItem('email')
    footprints.value = []
    myFootprints.value = []
    views.value = {}
    reactions.value = {}
    countries.value = []
    email.value = ''
    password.value = ''
}

const getData = async () => {
    try {
        const authToken = localStorage.getItem('authToken')
        if (authToken) {
            const data = await fetch(
                `${ friendsQuestApi }/footprints`,
                {
                    headers: {
                        'x-auth': authToken,
                    },
                }
            )
            if (!data.ok && data.status === 403) {
                logout()
                alert('Your session has expired. Please login again.')
                return
            }
            footprints.value = (await data.json()).data

            myFootprints.value = footprints.value
            .filter((fp: any) => fp.createdBy.email === email.value)

            const coordinates = myFootprints.value.map((coords: any) => ({
                lat: coords.latitude,
                lon: coords.longitude,
            }))
            const reversedGeoData = await (await fetch('https://n1j0.netlify.app/.netlify/functions/reverse-geo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(coordinates),
            })).json()

            myFootprints.value = myFootprints.value
            .map((fp: any, index: number) => ({
                ...fp,
                country: reversedGeoData[index] || '',
            })) as any

            calculateViews(myFootprints.value)
            calculateReactions(myFootprints.value)
            calculateCountries(myFootprints.value)
        }
    } catch (error: any) {
        console.error(error.message)
    }
}

</script>

<template>
    <form v-if="!loggedIn" @submit.prevent="login">
        <input v-model="email" type="text"/>
        <input v-model="password" type="password"/>
        <button type="submit">Login</button>
        <p>{{ error }}</p>
    </form>
    <button v-else @click="logout">Logout</button>

    <template v-if="myFootprints.length > 0">
        <p>Views: {{ views }}</p>
        <p>Reactions: {{ reactions }}</p>
        <p>Total footprints: {{ myFootprints.length }}</p>
        <p>Number of countries: {{ countries.length }}</p>
        <table>
            <tr>
                <th>Country</th>
                <th>Footprints</th>
            </tr>
            <tr v-for="country in countries" :key="country.country">
                <td>{{ country.country }} {{ countryCodeEmoji(country.country) }}</td>
                <td>{{ country.count }}</td>
            </tr>
        </table>
        <world v-if="countryCodes.length > 0" :countries="countryCodes"/>
        <div class="footprints">
            <div v-for="fp in myFootprints" :key="fp.id">
                <h2>{{ fp.title }}</h2>
                <p>{{ fp.country }} {{ fp.country ? countryCodeEmoji(fp.country): '' }}</p>
                <p>{{ new Date(fp.createdAt).toDateString() }}</p>
                <p v-if="fp.description">{{ fp.description }}</p>
                <img loading="lazy" width="100" height="100" :src="fp.imageURL" alt="/"/>
                <audio controls :src="fp.audioURL"/>
                <p v-if="fp.temperature">{{ fp.temperature }} °C</p>
                <p>Views: {{ fp.viewCount }}</p>
                <ul>
                    <li v-for="user in fp.users" :key="user.id">{{ user.username }}</li>
                </ul>
            </div>
        </div>
    </template>
</template>

<style>
.footprints {
    display: grid;
}
</style>
