<script setup>
// @ is an alias for src, making this an absolute path
import SearchSongCard from '@/components/SearchSongCard.vue';
import { useSpotifyDataStore } from '@/stores/spotifyData';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const spotifyDataStore = useSpotifyDataStore();
const { recentlyPlayedTracks } = storeToRefs(spotifyDataStore);

onMounted(async () => {
  await spotifyDataStore.getRecentlyPlayedTracks(); // make sure the data has loaded
  console.log(recentlyPlayedTracks.value); // log the data to the console
})
</script>


<template>
    <div v-if="recentlyPlayedTracks && recentlyPlayedTracks.items" class="song-container">
      <h2 class="header">Your Recently Played Songs:</h2>
      <SearchSongCard
        v-for="song in recentlyPlayedTracks.items"
        :key="song.track.id"
        :cardProp="song.track"
        cardType="song"
      />
    </div>
</template>

<style>

.header {
  margin-left: 10px;
}

.song-container {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 360px;
}


</style>
