const axios = require('axios');

module.exports = async (req, res) => {
    const { word1, word2, minFollowers } = req.query;

    if (!word1 || !word2) {
        return res.status(400).json({ error: "2つのワードを入れてね" });
    }

    const bearerToken = "AAAAAAAAAAAAAAAAAAAAAAnK0QEAAAAA0V23zNHDMYnhibeW3i6LJylOZ2A%3D53FimQAT0qB0PyR4GrXlkZaZFWtJzV4f1KAmfSNsbo3vSRIzdP"; // ★正しいBearer Tokenを入れてね

    if (!bearerToken || bearerToken === "AAAAAAAAAAAAAAAAAAAAAAnK0QEAAAAA0V23zNHDMYnhibeW3i6LJylOZ2A%3D53FimQAT0qB0PyR4GrXlkZaZFWtJzV4f1KAmfSNsbo3vSRIzdP") {
        return res.status(500).json({ error: "Bearer Tokenが設定されてないよ" });
    }

    try {
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
            headers: {
                "Authorization": `Bearer ${bearerToken}`
            },
            params: {
                "query": `${word1} ${word2}`,
                "max_results": 100,
                "tweet.fields": "author_id",
                "expansions": "author_id",
                "user.fields": "username,name,description,public_metrics"
            }
        });

        const tweets = response.data.data || [];
        const users = response.data.includes?.users || [];
        const filteredResults = tweets.map(tweet => {
            const user = users.find(u => u.id === tweet.author_id);
            const followers = user.public_metrics.followers_count;
            const hasWord1 = tweet.text.toLowerCase().includes(word1.toLowerCase()) || user.description.toLowerCase().includes(word1.toLowerCase());
            const hasWord2 = tweet.text.toLowerCase().includes(word2.toLowerCase()) || user.description.toLowerCase().includes(word2.toLowerCase());
            if (followers >= minFollowers && hasWord1 && hasWord2) {
                return {
                    name: user.name,
                    username: user.username,
                    description: user.description,
                    tweetText: tweet.text,
                    followers: followers
                };
            }
        }).filter(result => result);

        res.status(200).json(filteredResults);
    } catch (error) {
        console.log("エラー詳細:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "Twitter APIでエラーが出たよ",
            details: error.response ? error.response.data : error.message 
        });
    }
};