export default async function handler(req, res) {
  const { delivery_num } = req.query;

  const API_KEY = 'UGJ8gXjCfh%2FC8Ek72mAP4Zel%2BCY%2FjdLnBzbvEDUa60gqxuHTPl1RKCeTevItd%2FFRT6NjQsY7fgdnM3OMSMTXKA%3D%3D';  // 반드시 인코딩된 키여야 함
  const url = `http://openapi.epost.go.kr/trace/retrieveLongitudinalCombinedService/retrieveLongitudinalCombinedService/getLongitudinalCombinedList?ServiceKey=${API_KEY}&rgist=${delivery_num}`;

  try {
    const response = await fetch(url);
    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: '우체국 API 요청 실패', detail: error.message });
  }
}