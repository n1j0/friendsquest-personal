<script setup lang="ts">
import Globe from 'globe.gl'

const props = defineProps({
    countries: {
        type: Array,
        required: true
    }
})

onMounted(() => {
    fetch('./countries.geojson').then(res => res.json()).then(geoData =>
    {
        const world = Globe()
            .width(500)
            .height(500)
            .globeImageUrl('./earth-dark.jpg')
            .polygonsData(geoData.features)
            .polygonCapCurvatureResolution(3)
            .polygonAltitude(0.02)
            .polygonCapColor((data: any) => `#${props.countries.includes(data.properties.ISO_A2) ? '489d22' : '919191'}`)
            (document.getElementById('globe')!)
    });
})
</script>

<template>
    <div id="globe"></div>
</template>

<style scoped>

</style>