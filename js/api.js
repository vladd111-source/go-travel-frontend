export async function fetchLocation(query) {
  const url = `https://skyscanner89.p.rapidapi.com/flights/locations?query=${encodeURIComponent(query)}`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    const item = json[0];
    return item ? { code: item.code, id: item.entityId } : null;
  } catch (err) {
    console.error('Ошибка поиска города:', err);
    return null;
  }
}

export async function fetchFlights(fromCode, fromId, toCode, toId) {
  const url = `https://skyscanner89.p.rapidapi.com/flights/one-way/list?origin=${fromCode}&originId=${fromId}&destination=${toCode}&destinationId=${toId}`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки рейсов:', err);
    return null;
  }
}
