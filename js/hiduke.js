    // JavaScriptで半年後の月を計算して表示
    window.onload = function() {
      // 現在の日付を取得
      const currentDate = new Date();

      // 半年後の月を取得
      currentDate.setMonth(currentDate.getMonth() + 5);

      // 年と月を取得
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 月は0から始まるため+1

      // 「○○○○年○月」という形式で表示
      const formattedDate = `${year}年${month}月`;

      // HTMLの指定した場所に表示
      document.getElementById("output").innerText = formattedDate;
    };