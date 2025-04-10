async function fetchLocation(cityName) {
  const url = `https://skyscanner89.p.rapidapi.com/config/locations?search=${cityName}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    console.log(data); // 👈 глянь, что приходит, и выберем нужные поля
    return data;
  } catch (err) {
    console.error('Ошибка поиска города:', err);
  }
}
export async function fetchLocation(cityName) {
  const url = `https://skyscanner89.p.rapidapi.com/config/locations?search=${cityName}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data?.data?.[0]; // возвращаем первый результат
  } catch (err) {
    console.error('Ошибка поиска города:', err);
    return null;
  }
}
