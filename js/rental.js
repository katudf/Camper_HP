function calculateDuration() {
  const rentalDate = document.getElementById('rentalDate').value;
  const rentalTime = document.getElementById('rentalTime').value;
  const returnDate = document.getElementById('returnDate').value;
  const returnTime = document.getElementById('returnTime').value;

  // 必要なデータが揃っていない場合は処理を終了
  if (!rentalDate || !rentalTime || !returnDate || !returnTime) {
    document.getElementById('kikan').value = '';
    return;
  }

  const rentalDateTime = new Date(`${rentalDate}T${rentalTime}`);
  const returnDateTime = new Date(`${returnDate}T${returnTime}`);

  if (returnDateTime <= rentalDateTime) {
    document.getElementById('kikan').value = '返却日時は貸出日時より後である必要があります。';
    return;
  }

  let currentDateTime = new Date(rentalDateTime);
  let weekdayHours = 0;
  let weekendHours = 0;

  // 1時間単位でループして平日と土日を計算
  while (currentDateTime < returnDateTime) {
    const nextHour = new Date(currentDateTime);
    nextHour.setHours(currentDateTime.getHours() + 1);

    if (nextHour > returnDateTime) {
      nextHour.setTime(returnDateTime.getTime());
    }

    const duration = (nextHour - currentDateTime) / (1000 * 60 * 60); // 時間単位で計算

    if (currentDateTime.getDay() === 0 || currentDateTime.getDay() === 6) {
      // 土日 (日曜日: 0, 土曜日: 6)
      weekendHours += duration;
    } else {
      // 平日
      weekdayHours += duration;
    }

    currentDateTime = nextHour;
  }

  // 結果を<input>に出力
  document.getElementById('kikan').value = `平日 ${weekdayHours.toFixed(2)}時間, 土日 ${weekendHours.toFixed(2)}時間`;
}
