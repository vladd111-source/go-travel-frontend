export async function getAmadeusToken() {
  const clientId = "10UMyGcxHVsK1sK8x1U8MCqgR7g1LuDo"; // замени на свой
  const clientSecret = "0bXLQrqxEAyFjdkx"; // замени на свой

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const data = await response.json();
  return data.access_token;
}
