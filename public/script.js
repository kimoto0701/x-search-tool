let lastSearchTime = 0;
const searchCooldown = 5000;

async function search() {
    const now = Date.now();
    if (now - lastSearchTime < searchCooldown) {
        alert('少し待ってね！5秒以内に連続検索はできません。');
        return;
    }
    const word1Input = document.getElementById('word1');
    const word2Input = document.getElementById('word2');
    const minFollowersInput = document.getElementById('minFollowers');
    console.log('word1Input:', word1Input);
    console.log('word2Input:', word2Input);
    console.log('minFollowersInput:', minFollowersInput);
    if (!word1Input || !word2Input || !minFollowersInput) {
        alert('入力欄が見つかりません。以下のIDを確認してください: word1, word2, minFollowers');
        return;
    }
    const word1 = word1Input.value;
    const word2 = word2Input.value;
    const minFollowers = minFollowersInput.value;
    try {
        const response = await fetch(`/api/search?word1=${word1}&word2=${word2}&minFollowers=${minFollowers}`);
        const results = await response.json();
        if (results.error) {
            if (response.status === 429) {
                alert('リクエストが多すぎるよ！少し待ってからまた試してね。');
            } else {
                alert(`${results.error} ${results.details ? JSON.stringify(results.details) : ''}`);
            }
            return;
        }
        const resultDiv = document.getElementById('results');
        resultDiv.innerHTML = results.map(r => `<p>${r.name} (@${r.username}): ${r.tweetText}</p>`).join('');
        lastSearchTime = now;
    } catch (error) {
        alert('検索中にエラーが発生しました');
        console.error(error);
    }
}

function checkPassword() {
    const password = document.getElementById('password').value;
    if (password === '1234') {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('search-screen').style.display = 'block';
    } else {
        alert('パスワードが違います');
    }
}