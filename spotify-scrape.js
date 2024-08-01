let fs = require("fs");

async function main() {
    const body = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
        }).toString(),
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .catch((error) => {
            console.log(error);
        });

    let api_key = body.access_token;

    console.log(api_key);

    const indexes = [0, 100, 200, 300];
    return Promise.all(indexes.map(async (i) => {
        const params = new URLSearchParams({ limit: 100, offset: i });
        const url = new URL(`https://api.spotify.com/v1/playlists/5Iv5H6o09HUWk755JVmMO2/tracks?${params}`);

        const data = await fetch(url, {
            headers: { authorization: `Bearer ${api_key}` },
        })
            .then((res) => {
                if (!res.ok) {
                    console.log(res);
                    throw new Error(res.status);
                }
                return res.json();
            })
            .catch((error) => {
                console.log(error);
            });
        return data.items.map((e) => e.track.uri);
    }));
}

main().then(values => {
  let tracks = values.flat()
  fs.writeFileSync("spotify-tracks.txt", tracks.join("\n"));
});
