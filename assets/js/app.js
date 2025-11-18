const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");

// Controls
const tuongSelect = document.getElementById("tuongSelect");
const skinSelect = document.getElementById("skinSelect");
const khungSelect = document.getElementById("khungSelect");
const phepSelect = document.getElementById("phepSelect");
const thongthaoSelect = document.getElementById("thongthaoSelect");
const trikiSelect = document.getElementById("trikiSelect");
const phuhieuGroupSelect = document.getElementById("phuhieuGroupSelect");
const phuhieuSelect = document.getElementById("phuhieuSelect");
const vienvangCheck = document.getElementById("vienvangCheck");
const tenGameInput = document.getElementById("tenGameInput");
const saveBtn = document.getElementById("saveBtn");
const createBtn = document.getElementById("createBtn");

// MỚI: Thêm controls cho nhập tên tướng thủ công và upload ảnh
const tenTuongInput = document.getElementById("tenTuongInput");
const heroImageUpload = document.getElementById("heroImageUpload");

// ... (Phần code hiện tại giữ nguyên)

// MỚI: Thêm controls cho tabs và clear button
const defaultTabBtn = document.getElementById("defaultTabBtn");
const editProTabBtn = document.getElementById("editProTabBtn");
const defaultTabContent = document.getElementById("defaultTabContent");
const editProTabContent = document.getElementById("editProTabContent");
const clearHeroImage = document.getElementById("clearHeroImage");

// MỚI: Hàm switch tab
function switchTab(tab) {
  if (tab === 'default') {
    defaultTabBtn.classList.add('active');
    editProTabBtn.classList.remove('active');
    defaultTabContent.style.display = 'block';
    editProTabContent.style.display = 'none';
  } else {
    defaultTabBtn.classList.remove('active');
    editProTabBtn.classList.add('active');
    defaultTabContent.style.display = 'none';
    editProTabContent.style.display = 'block';
  }
  resetCustomInputs();  // Reset dữ liệu khi switch tab
}

// MỚI: Hàm reset inputs tùy chỉnh
function resetCustomInputs() {
  tenTuongInput.value = '';  // Xóa tên tướng thủ công
  heroImageUpload.value = '';  // Xóa file selected
  uploadedHeroImage = null;   // Xóa biến lưu ảnh
  clearHeroImage.style.display = 'none';  // Ẩn dấu X
}

// MỚI: Event cho tabs
defaultTabBtn.addEventListener('click', () => switchTab('default'));
editProTabBtn.addEventListener('click', () => switchTab('editPro'));

// MỚI: Xử lý upload ảnh hero/skin (cập nhật để hiển thị dấu X)
heroImageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        uploadedHeroImage = img;  // Lưu ảnh upload
        clearHeroImage.style.display = 'inline';  // Hiển thị dấu X
      };
    };
    reader.readAsDataURL(file);
  }
});

// MỚI: Event cho dấu X để xóa ảnh
clearHeroImage.addEventListener('click', () => {
  resetCustomInputs();
});

// ... (Phần còn lại của code giữ nguyên, bao gồm drawCanvas sử dụng uploadedHeroImage nếu có)

// Data
let heroes = [];
let khungs = [];
let pheps = [];
let thongthaos = [];
let trikis = [];
const vienvangFile = "vienvang.png";

// MỚI: Biến lưu ảnh upload (sẽ là đối tượng Image nếu upload)
let uploadedHeroImage = null;

// ==================
// Load JSON động
// ==================
async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load ' + url + ' (status ' + res.status + ')');
  return await res.json();
}

async function loadAllData() {
  heroes = await loadJSON("assets/data/heroandskin.json");
  khungs = await loadJSON("assets/data/khung.json");
  pheps = await loadJSON("assets/data/phepbotro.json");
  thongthaos = await loadJSON("assets/data/thongthao.json");
  trikis = await loadJSON("assets/data/triki.json");
  phuhieus = await loadJSON("assets/data/phuhieu.json");
  
  populateSelect(tuongSelect, heroes, true);
  populateSelect(khungSelect, khungs);
  populateSelect(phepSelect, pheps);
  populateSelect(thongthaoSelect, thongthaos);
  populateSelect(trikiSelect, trikis);

  // Gọi event change để load danh sách skin đầu tiên
  tuongSelect.dispatchEvent(new Event("change"));
  
}

// ==================
// Populate select
// ==================
function populateSelect(select, data, isHero=false) {
  select.innerHTML = "";
  data.forEach(item => {
    const option = document.createElement("option");
    if(isHero){
      option.value = item.name;
      option.textContent = item.name;
    } else {
      option.value = item.file;
      option.textContent = item.displayName || item.file;
    }
    select.appendChild(option);
  });
}

// ==================
// Helper
// ==================
function getSelectedHero() {
  return heroes.find(h => h.name === tuongSelect.value);
}

function getSelectedSkin() {
  const hero = getSelectedHero();
  return hero?.skins.find(s => s.file === skinSelect.value);
}

function loadImage(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.src = "assets/images/" + src;
    img.onload = ()=>resolve(img);
    img.onerror = ()=>resolve(null);
  });
}

function drawImageCover(ctx, img, x, y, w, h){
  if(!img) return;
  const scale = Math.min(w / img.width, h / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  const ix = x + (w - iw)/2;
  const iy = y + (h - ih)/2;
  ctx.drawImage(img, ix, iy, iw, ih);
}

function updatePhuhieuList(groupKey) {
  const groupData = phuhieus[groupKey] || [];
  phuhieuSelect.innerHTML = "";
  groupData.forEach(item => {
    const option = document.createElement("option");
    option.value = item.file;
    option.textContent = item.displayName;
    phuhieuSelect.appendChild(option);
  });
}

// MỚI: Xử lý upload ảnh hero/skin
heroImageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        uploadedHeroImage = img;  // Lưu ảnh upload vào biến
      };
    };
    reader.readAsDataURL(file);
  }
});

// ==================
// Draw canvas
// ==================
async function drawCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const hero = getSelectedHero();
  const skin = getSelectedSkin();
  const khung = khungSelect.value;
  const phep = phepSelect.value;
  const thongthao = thongthaoSelect.value;
  const triki = trikiSelect.value;
  const vien = vienvangCheck.checked ? vienvangFile : null;
  const nameGame = tenGameInput.value;

  // MỚI: Sử dụng tên tướng thủ công nếu được nhập, ưu tiên hơn tên từ select
  const heroName = tenTuongInput.value.trim() || (hero ? hero.name : '');

  // Layer 1: Hero + skin - Ưu tiên ảnh upload nếu có, nếu không dùng ảnh từ skin
  let imgHero = null;
  if (uploadedHeroImage) {
    imgHero = uploadedHeroImage;
  } else if (skin) {
    imgHero = await loadImage("heroandskin/" + skin.file);
  }
  if (imgHero) {
    const newWidth = canvas.width * 0.91;
    const newHeight = canvas.height * 0.91;
    const newX = (canvas.width - newWidth) / 2;
    const newY = 60;
    drawImageCover(ctx, imgHero, newX, newY, newWidth, newHeight);
  }

  // Layer 2: Khung nền
  const imgKhungNen = await new Promise((resolve) => {
    const img = new Image();
    img.src = "assets/logo-images/khungnen.png";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });

  if (imgKhungNen) ctx.drawImage(imgKhungNen, 0, 0, canvas.width, canvas.height);

  // Layer 3: Viền vàng
  if (vien) {
    const imgVien = await loadImage(vien);
    const newWidth = canvas.width * 0.84;
    const newHeight = canvas.height * 0.84;
    const newX = (canvas.width - newWidth) / 2;
    const newY = 460;
    drawImageCover(ctx, imgVien, newX, newY, newWidth, newHeight);
  }

  // Layer 4: Khung
  const imgKhung = await loadImage("khung/" + khung);
  drawImageCover(ctx, imgKhung, 0,0, canvas.width, canvas.height);

  // Layer 5: Tag (giữ nguyên nếu có từ skin)
  if (skin && skin.tag) {
    const imgTag = await loadImage("tag/" + skin.tag + ".png");
    if (imgTag) {
      const tagW = 380;
      const scale = tagW / imgTag.width;
      const tagH = imgTag.height * scale;
      const tagX = (canvas.width - tagW) / 2; 
      const tagY = canvas.height - tagH - 455;
      drawImageCover(ctx, imgTag, tagX, tagY, tagW, tagH);
    }
  }

  // Layer 6: Thông thạo
  const imgThongthao = await loadImage("thongthao/" + thongthao);
  drawImageCover(ctx, imgThongthao, 50,40,240,240);

  // Layer 7: Phép bổ trợ
  const imgPhep = await loadImage("phepbotro/" + phep);
  drawImageCover(ctx, imgPhep, (canvas.width - 128) / 2, canvas.height - 166, 132, 132);
  
  // Layer 8: Tri kỉ
  const imgTriki = await loadImage("triki/" + triki);
  drawImageCover(ctx, imgTriki, 165, canvas.height - 185, 150, 150);

  // Layer 8.5: Phù hiệu
  const groupKey = phuhieuGroupSelect.value;
  const phuhieuFile = phuhieuSelect.value;
  if (phuhieuFile) {
    const imgPhuhieu = await loadImage("phuhieu/" + phuhieuFile);
    drawImageCover(ctx, imgPhuhieu, canvas.width - 330, 1020, 160, 160);
  }

  // Layer 9: Tên tướng - Sử dụng heroName (thủ công hoặc từ select)
  if (heroName) {
    let text = heroName;
    let fontSize = 75;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    do {
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      var textWidth = ctx.measureText(text).width;
      if (textWidth > 600) fontSize -= 1;
      else break;
    } while(fontSize > 10);

    const x = canvas.width / 2;
    const y = canvas.height - 328;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(text, x, y);

    ctx.fillStyle = "#3094ff";
    ctx.fillText(text, x, y);
  }
  
  // Layer 10: Tên skin (giữ nguyên nếu có từ skin)
  if(skin && skin.displayName){
    let text = skin.displayName;
    let fontSize = 75;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    do {
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      var textWidth = ctx.measureText(text).width;
      if (textWidth > 630) fontSize -= 1;
      else break;
    } while(fontSize > 10);

    const x = canvas.width / 2;
    const y = canvas.height - 430;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(text, x, y);

    ctx.fillStyle = "#ead39eff";
    ctx.fillText(text, x, y);
  }

  // Layer 11: Tên game
  ctx.font = `68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = vienvangCheck.checked ? "#ffe092ff" : "#ffffff";
  ctx.fillText(nameGame, canvas.width / 2, canvas.height - 234);
}

// ==================
// Event listeners
// ==================
tuongSelect.addEventListener("change", () => {
  const hero = getSelectedHero();
  if (!hero || !hero.skins) return;
  populateSelect(skinSelect, hero.skins);
  skinSelect.selectedIndex = 0;
});

// ==================
// Nút "Tạo ảnh"
// ==================
createBtn.addEventListener("click", async () => {
  createBtn.disabled = true;
  createBtn.textContent = "⏳ Đang tạo ảnh...";

  await drawCanvas();

  const imgData = canvas.toDataURL("image/png");

  const oldImg = document.getElementById("imgPreview");
  if (oldImg) oldImg.remove();

  const imgPreview = document.createElement("img");
  imgPreview.id = "imgPreview";
  imgPreview.src = imgData;
  imgPreview.alt = "Ảnh đã tạo";
  imgPreview.style.width = "100%";
  imgPreview.style.maxWidth = "600px";
  imgPreview.style.display = "block";
  imgPreview.style.margin = "40px auto";
  imgPreview.style.borderRadius = "12px";
  imgPreview.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  imgPreview.style.userSelect = "none";
  imgPreview.style.webkitUserSelect = "none";

  // 🐧 CHỈNH Ở ĐÂY: chèn ảnh vào giữa 2 nút
  saveBtn.parentNode.insertBefore(imgPreview, saveBtn);

  canvas.style.display = "none";
  saveBtn.style.display = "inline-block";
  saveBtn.onclick = () => {
    const link = document.createElement("a");
    link.download = "skin_preview.png";
    link.href = imgData;
    link.click();
  };

  createBtn.disabled = false;
  createBtn.textContent = "✨ Tạo ảnh";
});

// ==================
// Nút "Lưu ảnh"
// ==================
saveBtn.addEventListener("click", ()=>{
  const link = document.createElement("a");
  link.download = "skin_preview.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// ==================
// Init
// ==================
loadAllData();

phuhieuGroupSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  if (value && value !== "none") {
    phuhieuLabel.style.display = "inline-block";
    updatePhuhieuList(value);
  } else {
    phuhieuLabel.style.display = "none";
  }
});
document.getElementById("saveBtn").addEventListener("click", () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const img = document.getElementById("imgPreview");

  // 🐧 Phát hiện nếu mở bằng app (Facebook, Zalo, TikTok)
  if (/Zalo|FBAN|FBAV|TikTok/i.test(userAgent)) {
    alert(
      "⚠️ Bạn đang mở trang bằng ứng dụng (Facebook / Messenger / Zalo / TikTok,...)\n\n" +
      "🐧 Hãy bấm vào nút ... hoặc dấu chia sẻ → chọn 'Mở bằng trình duyệt (Safari / Chrome)' để lưu hình nhé!\n\n" +
      "😍Hoặc Bấm giữ 2s hình ảnh để lưu nhé, trên pc thì click chuột phải chọn lưu hình."
    );
    return;
  }

  // 🐧 Nếu đang ở trình duyệt thật (Safari, Chrome...) → cho phép tải
  if (img) {
    const link = document.createElement("a");
    link.download = "tao-khung-lien-quan.png";
    link.href = img.src;
    link.click();
  } else {
    alert("🐧 Chưa có ảnh để lưu nha!");
  }
});