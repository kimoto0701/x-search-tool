const axios = require('axios');

module.exports = async (req, res) => {
    const { word1, word2, minFollowers } = req.query;
    if (!word1 || !word2) return res.status(400).json({ error: "2つのワードを入れてね" });
    const bearerToken = "YOUR_BEARER_TOKEN"; // 実際のトークンを使ってね
    try {
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
            headers: { "Authorization": `Bearer ${bearerToken}` },
            params: { "query": `${word1} ${word2}`, "max_results": 100, "tweet.fields": "author_id", "expansions": "author_id", "user.fields": "username,name,description,public_metrics" }
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
                return { name: user.name, username: user.username, description: user.description, tweetText: tweet.text, followers: followers };
            }
        }).filter(result => result);
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
        if (error.response && error.response.status === 429) {
            // 429エラーの場合、そのままクライアントに伝える
            res.status(429).json({ error: "リクエストが多すぎるよ！少し待ってからまた試してね", details: error.response.data });
        } else {
            // その他のエラー
            res.status(500).json({ error: "Twitter APIでエラーが出たよ", details: error.response ? error.response.data : error.message });
        }
    }
};