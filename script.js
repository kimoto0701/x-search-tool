// パスワードチェック
function checkPassword() {
    const password = document.getElementById("password-input").value;
    if (password === "1234") {
        document.getElementById("password-screen").style.display = "none";
        document.getElementById("tool-screen").style.display = "block";
    } else {
        alert("パスワードが違います！");
    }
}

// 検索カウント用
let totalCount = 0;
let monthCount = 0;
const currentMonth = new Date().getMonth();

// 検索機能
async function search() {
    const word1 = document.getElementById("word1").value;
    const word2 = document.getElementById("word2").value;
    const minFollowers = document.getElementById("min-followers").value;

    if (!word1 || !word2) {
        alert("2つのワードを入れてね！");
        return;
    }

    document.getElementById("results").innerHTML = "検索中...";

    const bearerToken = "AAAAAAAAAAAAAAAAAAAAAAnK0QEAAAAA0V23zNHDMYnhibeW3i6LJylOZ2A%3D53FimQAT0qB0PyR4GrXlkZaZFWtJzV4f1KAmfSNsbo3vSRIzdP"; // ★ここに正しいBearer Tokenを入れてね

    try {
        // X APIで投稿を検索
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
            headers: {
                "Authorization": `Bearer ${bearerToken}`
            },
            params: {
                "query": `${word1} ${word2}`, // 2つのワードを含む投稿を検索
                "max_results": 100, // 最大100件
                "tweet.fields": "author_id", // 投稿者のIDを取る
                "expansions": "author_id", // 投稿者の情報を取る
                "user.fields": "username,name,description,public_metrics" // ユーザー情報
            }
        });

        // 検索結果を整理
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
        }).filter(result => result); // 条件に合わないものは除外

        displayResults(filteredResults);
        updateCounts(filteredResults.length);
    } catch (error) {
        console.error(error);
        document.getElementById("results").innerHTML = "エラーが出たよ: " + error.message;
    }
}

// 結果を表示
function displayResults(results) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    const limitedResults = results.slice(0, 100); // 最大100件
    limitedResults.forEach(result => {
        const word1 = document.getElementById("word1").value;
        const word2 = document.getElementById("word2").value;
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
            <p>名前: ${result.name} (@${result.username})</p>
            <p>ワード1が含まれる文章: ${result.tweetText.includes(word1) ? result.tweetText : result.description} (<a href="https://twitter.com/${result.username}" target="_blank">リンク</a>)</p>
            <p>ワード2が含まれる文章: ${result.tweetText.includes(word2) ? result.tweetText : result.description} (<a href="https://twitter.com/${result.username}" target="_blank">リンク</a>)</p>
        `;
        resultsDiv.appendChild(div);
    });
}

// カウントを更新
function updateCounts(count) {
    totalCount += count;
    monthCount += count;
    document.getElementById("total-count").innerText = totalCount;
    document.getElementById("month-count").innerText = monthCount;
}

// CSVで保存
function exportCSV() {
    const results = document.getElementById("results").innerHTML;
    if (!results || results === "検索中...") {
        alert("結果がないよ！");
        return;
    }
    const csv = "名前,ワード1の文章,ワード2の文章\n" + Array.from(document.querySelectorAll(".result-item"))
        .map(item => {
            const [name, w1, w2] = item.innerText.split("\n");
            return `"${name.split(": ")[1]}","${w1.split(": ")[1]}","${w2.split(": ")[1]}"`;
        }).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "x-search-results.csv";
    link.click();
}