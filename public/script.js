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

    try {
        const response = await axios.get("/api/search", {
            params: { word1, word2, minFollowers }
        });
        const results = response.data;
        displayResults(results);
        updateCounts(results.length);
    } catch (error) {
        document.getElementById("results").innerHTML = "エラーが出たよ: " + (error.response?.data?.error || error.message);
    }
}

// 結果を表示
function displayResults(results) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    const limitedResults = results.slice(0, 100);
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

// 検索ボタンが押されたときの処理（既存のコードを仮定）
let lastSearchTime = 0;
const searchCooldown = 5000; // 5秒待機（5000ミリ秒）

async function search() {
    const now = Date.now();
    if (now - lastSearchTime < searchCooldown) {
        alert('少し待ってね！5秒以内に連続検索はできません。');
        return;
    }

    const word1 = document.getElementById('word1').value;
    const word2 = document.getElementById('word2').value;
    const minFollowers = document.getElementById('minFollowers').value;

    try {
        const response = await fetch(`/api/search?word1=${word1}&word2=${word2}&minFollowers=${minFollowers}`);
        const results = await response.json();

        if (results.error) {
            alert(`${results.error} ${results.details ? JSON.stringify(results.details) : ''}`);
            return;
        }

        displayResults(results); // 仮の表示関数
        lastSearchTime = now; // 検索時間を更新
    } catch (error) {
        alert('検索中にエラーが発生しました');
        console.error(error);
    }
}

// 仮の表示関数（既存のコードに合わせてください）
function displayResults(results) {
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = results.map(r => `<p>${r.name} (@${r.username}): ${r.tweetText}</p>`).join('');
}