require('dotenv').config(); // これで.envを読み込む
const axios = require('axios');

module.exports = async (req, res) => {
    const { word1, word2, minFollowers } = req.query;
    if (!word1 || !word2) return res.status(400).json({ error: "2つのワードを入れてね" });
    const bearerToken = process.env.TWITTER_BEARER_TOKEN; // 環境変数からトークンを取る
    try {
        console.log("APIリクエスト開始:", { word1, word2, minFollowers });
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
            headers: { "Authorization": `Bearer ${bearerToken}` },
            params: { "query": `${word1} ${word2}`, "max_results": 100, "tweet.fields": "author_id", "expansions": "author_id", "user.fields": "username,name,description,public_metrics" }
        });
        console.log("APIレスポンス:", response.data);
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
        console.log("結果:", uniqueResults);
        res.status(200).json(uniqueResults);
    } catch (error) {
        console.error("エラー発生:", error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "リクエストが多すぎるよ！少し待ってからまた試してね", details: error.response.data });
        } else {
            res.status(500).json({ error: "Twitter APIでエラーが出たよ", details: error.response ? error.response.data : error.message });
        }
    }
};