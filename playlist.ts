require('dotenv').config();
import axios, { AxiosResponse } from 'axios';
const cheerio = require('cheerio');
import YouTubeMusic from "youtube-music-ts-api";

async function main(): Promise<void> {
    const cookieStr = process.env.YOUTUBE_COOKIE_STRING;
    const ytm = new YouTubeMusic();
    const ytma = await ytm.authenticate(cookieStr);

    const URL = 'https://www.last.fm/home/tracks'
    const config = {
        headers: {
            cookie: process.env.LASTFM_COOKIE_STRING,
        }
    }

    const fetchLastfmHTML = async () => {
        return await axios.get(URL, config);
    }

    const scrapeIDs = async () => {
        const $ = cheerio.load((await fetchLastfmHTML()).data);
        let tracks = [];

        $("div.recs-feed-inner-wrap").each((i, elem) => {
            if ($(elem).children('a').attr("data-youtube-id")) {
                tracks.push($(elem).children('a').attr("data-youtube-id"));
            }
        })
        return await Promise.all(tracks);
    }

    const clearPlaylist = async (id) => {
        let deleteTracks: boolean
        const playlistDetail = await ytma.getPlaylist(id)
        if (playlistDetail) {
            deleteTracks = await ytma.removeTracksFromPlaylist(id, ...playlistDetail.tracks)
        }
        return deleteTracks
    }

    const addTracks = async (songids) => {
        let tracks = []
        for (const id of songids) {
            tracks.push({ id: id })
        }
        const added = await ytma.addTracksToPlaylist(await checkPlaylists(), ...tracks)
        return added;
    }

    const checkPlaylists = async () => {
        const playlists = await ytma.getLibraryPlaylists();
        if (playlists) {
            for (const playlist of playlists) {
                if (playlist.name == process.env.PLAYLIST_NAME && await clearPlaylist(playlist.id)) {
                    return playlist.id.substring(2);
                }
            }
        }
        return (await createPlaylist()).id;
    }

    const createPlaylist = async () => {
        const playlistname = process.env.PLAYLIST_NAME
        const playlistdesc = 'Recommendations';
        const playlistpriv = 'PRIVATE';

        const created = await ytma.createPlaylist(playlistname, playlistdesc, playlistpriv)

        return created;
    }

    console.log(await addTracks(await scrapeIDs()));
    
}

main();