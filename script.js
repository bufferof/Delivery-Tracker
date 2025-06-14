const API_KEY = 'UGJ8gXjCfh%2FC8Ek72mAP4Zel%2BCY%2FjdLnBzbvEDUa60gqxuHTPl1RKCeTevItd%2FFRT6NjQsY7fgdnM3OMSMTXKA%3D%3D';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

var Current_Position = null;
var MAP_INSTANCE = null;

document.addEventListener('DOMContentLoaded', function() {
  kakao.maps.load(function() {
    const container = document.getElementById('map');

    const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780); // 서울시청
    const map = new kakao.maps.Map(container, {
      center: defaultPosition,
      level: 3
    });

    const marker = new kakao.maps.Marker();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const locPosition = new kakao.maps.LatLng(latitude, longitude);

        Current_Position = locPosition;

        map.setCenter(locPosition);

        marker.setPosition(locPosition);
        marker.setMap(map);

        MAP_INSTANCE = map;
      },
      (error) => {
        alert("...시스템이 생각하기를 포기함");
      }
    );
  });
});

function isdigit(data) {
  return !isNaN(data) && !isNaN(parseFloat(data));
}


async function getPostOfficeByName(targetName) {
  
  let page = 1;
  const per = 100;
  const max = 35;

  while (page <= max) {
    const result = await fetch(`https://api.odcloud.kr/api/15070368/v1/uddi:cea8854d-35c4-4a7f-a100-f241ea289d76?page=${page}&perPage=${per}&serviceKey=${API_KEY}`);
    const json = await result.json();
    const matcher = json.data.filter(item=> item["우체국명"] === targetName);

    if (matcher.length > 0) {
      return matcher[0]; 
    }
    page++;
  }

  return false; 
}

function add_marker(map, position, title){
  const marker = new kakao.maps.Marker({
    position:position,
    title:title,
    map:map,
  })

  const path = [
    Current_Position,
    position
  ]

  const polyline = new kakao.maps.Polyline({
    path:path,
    strokeWeight: 3,
    strokeColor: '#FF0000',
    strokeOpacity: 0.7,
    strokeStyle: 'solid'
  })

  const info_window = new kakao.maps.InfoWindow({
    content: `<div style="padding:2px; font-size:13px; color:#000; width:auto;">${title}</div>`,
  })

  kakao.maps.event.addListener(marker,'click',function(){
    info_window.open(map,marker);
  })

  polyline.setMap(MAP_INSTANCE);
  map.setCenter(position);
}

function getinfos(form){
  document.getElementById('track_button').innerText = "로딩중";
  document.getElementById('track_button').disabled = true;

  console.log("wef");
  

  if(!isdigit(form.delivery_number.value)){
    alert("올바른 등기번호를 입력해주세요");
    document.getElementById('track_button').innerText = "추적";
    document.getElementById('track_button').disabled = false;
    return;
  }

  const delivery_num = form.delivery_number.value;

  fetch(`${PROXY}http://openapi.epost.go.kr/trace/retrieveLongitudinalCombinedService/retrieveLongitudinalCombinedService/getLongitudinalCombinedList?ServiceKey=${API_KEY}&rgist=${delivery_num}`)
  .then(response => response.text())
  .then(async data => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "text/xml");

    if(xml.querySelector('successYN').textContent!= 'Y'){
      alert("조회 결과가 없습니다.");
      document.getElementById('track_button').innerText = "추적";
      document.getElementById('track_button').disabled = false;
      return;
    }

    const items = document.getElementsByClassName('info_contents');
    const detail_node = xml.querySelectorAll('detaileTrackList');
    let latest_node = null;


    let max_node = 0;
    for(let it of detail_node){
      if (parseInt(it.querySelector('sortNo').textContent) > max_node) {
        max_node = parseInt(it.querySelector('sortNo').textContent);
        latest_node = it;
      }
    }


    let location = null;
    var position_info = null;
    for(let it of items){
      if(it.id == 'time+location'){
        const arg1 = it.id.split('+')[0];
        const arg2 = it.id.split('+')[1];

        location = latest_node.querySelector(arg2).textContent;
        position_info = latest_node.querySelector(arg1).textContent + '  ' + location;
        it.textContent = position_info;

        continue;
      }

      if(latest_node.querySelector(it.id) !== null && latest_node.querySelector(it.id).textContent !== ''){
        it.textContent = latest_node.querySelector(it.id).textContent;
      }
      else if(xml.querySelector(it.id) !== null && xml.querySelector(it.id).textContent !== ''){
        it.textContent = xml.querySelector(it.id).textContent;
      }
      else{
        it.textContent = "정보 없음";
      }
    }

    let poffice_data = await getPostOfficeByName(location);

    if(poffice_data == false){
      alert("우체국이 존재하지 않습니다...");
      document.getElementById('track_button').innerText = "추적";
      document.getElementById('track_button').disabled = false;
      return;
    }

    poffice_data = poffice_data['주소(도로명)'];

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(poffice_data, function(result, status) {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        add_marker(MAP_INSTANCE, coords, position_info);
      } else {
        alert("주소 검색 실패");
      }
    });
  });

  document.getElementById('track_button').innerText = "추적";
  document.getElementById('track_button').disabled = false;
};