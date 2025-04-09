const axios = require('axios');

module.exports = async (req, res) => {
    const { word1, word2, minFollowers } = req.query;
    if (!word1 || !word2) {
        return res.status(400).json({ error: "2つのワードを入れてね" });
    }
    const bearerToken = "AAAAAAAAAAAAAAAAAAAAAAnK0QEAAAAAuB73E2lop8GEi8ssCbTZhOyZ4ig%3DaTYBAl08CAqg599H6JWF6pP1lqKCd04nMKDtqO4cTPbnzXdDIM";
    if (!bearerToken) {
        return res.status(500).json({ error: "Bearer Tokenが設定されてないよ" });
    }
    try {
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
            headers: { "Authorization": `Bearer ${bearerToken}` },
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
            const tweetHasWord1 = tweet.text.toLowerCase().includes(word1.toLowerCase());
            const descHasWord2 = user.description.toLowerCase().includes(word2.toLowerCase());
            const tweetHasWord2 = tweet.text.toLowerCase().includes(word2.toLowerCase());
            const descHasWord1 = user.description.toLowerCase().includes(word1.toLowerCase());
            
            if (followers >= minFollowers && ((tweetHasWord1 && descHasWord2) || (tweetHasWord2 && descHasWord1))) {
                return {
                    name: user.name,
                    username: user.username,
                    description: user.description,
                    tweetText: tweet.text,
                    followers: followers
                };
            }
        }).filter(result => result);

        // 重複排除
        const uniqueResults = [];
        const seenUsernames = new Set();
        filteredResults.forEach(result => {
            if (!seenUsernames.has(result.username)) {
                seenUsernames.add(result.username);
                uniqueResults.push(result);
            }
        });

        res.status(200).json(uniqueResults);
    } catch (error) {
        console.log("エラー詳細:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "Twitter APIでエラーが出たよ",
            details: error.response ? error.response.data : error.message 
        });
    }
};