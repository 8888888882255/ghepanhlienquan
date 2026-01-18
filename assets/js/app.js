// Canvas và context
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
const ssmSelect = document.getElementById("ssmSelect");          // Thêm control SSM
const saveBtn = document.getElementById("saveBtn");
const createBtn = document.getElementById("createBtn");

// Custom hero name & image upload
const tenTuongInput = document.getElementById("tenTuongInput");
const heroImageUpload = document.getElementById("heroImageUpload");
const clearHeroImage = document.getElementById("clearHeroImage");

// Tabs
const defaultTabBtn = document.getElementById("defaultTabBtn");
const editProTabBtn = document.getElementById("editProTabBtn");
const defaultTabContent = document.getElementById("defaultTabContent");
const editProTabContent = document.getElementById("editProTabContent");

// Data
let heroes = [];
let khungs = [];
let pheps = [];
let thongthaos = [];
let trikis = [];
let phuhieus = [];
let ssms = [];           // Dữ liệu SSM
const vienvangFile = "vienvang.png";
let uploadedHeroImage = null;

// ==================
// Load JSON
// ==================
async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url} - status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Load JSON error:", err);
    return [];
  }
}

async function loadAllData() {
  try {
    heroes = await loadJSON("assets/data/heroandskin.json");
    khungs = await loadJSON("assets/data/khung.json");
    pheps = await loadJSON("assets/data/phepbotro.json");
    thongthaos = await loadJSON("assets/data/thongthao.json");
    trikis = await loadJSON("assets/data/triki.json");
    phuhieus = await loadJSON("assets/data/phuhieu.json");
    ssms = await loadJSON("assets/data/ssm.json");           // Load SSM

    populateSelect(tuongSelect, heroes, true);
    populateSelect(khungSelect, khungs);
    populateSelect(phepSelect, pheps);
    populateSelect(thongthaoSelect, thongthaos);
    populateSelect(trikiSelect, trikis);
    populateSelect(ssmSelect, ssms);                               // Populate SSM

    // Khởi tạo skin khi chọn tướng đầu tiên
    tuongSelect.dispatchEvent(new Event("change"));
  } catch (err) {
    console.error("Load all data failed:", err);
    alert("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và file JSON.");
  }
}

// ==================
// Populate <select>
// ==================
function populateSelect(select, data, isHero = false) {
  select.innerHTML = "";
  if (!data || !Array.isArray(data)) return;

  data.forEach(item => {
    const option = document.createElement("option");
    if (isHero) {
      option.value = item.name;
      option.textContent = item.name;
    } else {
      option.value = item.file || "none";
      option.textContent = item.displayName || item.file || "Không dùng";
    }
    select.appendChild(option);
  });
}

// ==================
// Helpers
// ==================
function getSelectedHero() {
  return heroes.find(h => h.name === tuongSelect.value);
}

function getSelectedSkin() {
  const hero = getSelectedHero();
  return hero?.skins?.find(s => s.file === skinSelect.value);
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "assets/images/" + src;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("Không tải được ảnh:", src);
      resolve(null);
    };
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const scale = Math.max(w / img.width, h / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  const ix = x + (w - iw) / 2;
  const iy = y + (h - ih) / 2;
  ctx.drawImage(img, ix, iy, iw, ih);
}

function updatePhuhieuList(groupKey) {
  const groupData = phuhieus[groupKey] || [];
  phuhieuSelect.innerHTML = "";
  groupData.forEach(item => {
    const option = document.createElement("option");
    option.value = item.file;
    option.textContent = item.displayName || item.file;
    phuhieuSelect.appendChild(option);
  });
}

// ==================
// Tab switching
// ==================
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
  resetCustomInputs();
}

function resetCustomInputs() {
  tenTuongInput.value = '';
  heroImageUpload.value = '';
  uploadedHeroImage = null;
  if (clearHeroImage) clearHeroImage.style.display = 'none';
}

// ==================
// Event listeners
// ==================
tuongSelect.addEventListener("change", () => {
  const hero = getSelectedHero();
  if (!hero?.skins) return;
  populateSelect(skinSelect, hero.skins);
  skinSelect.selectedIndex = 0;
});

defaultTabBtn.addEventListener('click', () => switchTab('default'));
editProTabBtn.addEventListener('click', () => switchTab('editPro'));

heroImageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      uploadedHeroImage = img;
      if (clearHeroImage) clearHeroImage.style.display = 'inline';
    };
  };
  reader.readAsDataURL(file);
});

clearHeroImage?.addEventListener('click', resetCustomInputs);

phuhieuGroupSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  const phuhieuLabel = document.getElementById("phuhieuLabel"); // giả sử có label
  if (value && value !== "none" && value !== "khong") {
    if (phuhieuLabel) phuhieuLabel.style.display = "inline-block";
    updatePhuhieuList(value);
  } else {
    if (phuhieuLabel) phuhieuLabel.style.display = "none";
    phuhieuSelect.innerHTML = "";
  }
});

// ==================
// Vẽ canvas chính
// ==================
async function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const hero = getSelectedHero();
  const skin = getSelectedSkin();
  const khung = khungSelect.value;
  const phep = phepSelect.value;
  const thongthao = thongthaoSelect.value;
  const triki = trikiSelect.value;
  const vien = vienvangCheck.checked ? vienvangFile : null;
  const nameGame = tenGameInput.value.trim();
  const heroName = tenTuongInput.value.trim() || (hero?.name || '');

  // Layer 1: Hero / Skin
  let imgHero = uploadedHeroImage || (skin ? await loadImage("heroandskin/" + skin.file) : null);
  if (imgHero) {
    const newWidth = canvas.width * 0.78;
    const newHeight = canvas.height * 0.91;
    const newX = (canvas.width - newWidth) / 2;
    const newY = 60;
    drawImageCover(ctx, imgHero, newX, newY, newWidth, newHeight);
  }

  // Layer 2: Khung nền
  const imgKhungNen = await loadImage("logo-images/khungnen.png");
  if (imgKhungNen) ctx.drawImage(imgKhungNen, 0, 0, canvas.width, canvas.height);

// Layer 3: Viền vàng (mỏng + đẩy xuống)
if (vien) {
  const imgVien = await loadImage(vien);
  if (imgVien) {
    const scaleX = 0.84;
    const scaleY = 0.078; // chiều cao mỏng

    const w = canvas.width * scaleX;
    const h = canvas.height * scaleY;

    const x = (canvas.width - w) / 2;

    const offsetY = 365; // 👈 TĂNG số này để xuống nữa
    const y = (canvas.height - h) / 2 + offsetY;

    ctx.drawImage(imgVien, x, y, w, h);
  }
}



  // Layer 4: Khung
  const imgKhung = await loadImage("khung/" + khung);
  if (imgKhung) drawImageCover(ctx, imgKhung, 0, 0, canvas.width, canvas.height);

  // Layer 5: Tag skin (nếu có)
  if (skin?.tag) {
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

  // Layer 6: Thông thạo (responsive)
  const imgThongthao = await loadImage("thongthao/" + thongthao);
  if (imgThongthao) {
    const size = canvas.width * 0.205;   // kích thước icon (~18% chiều ngang)
    const x = canvas.width * 0.085;     // cách trái ~5.5%
    const y = canvas.height * 0.055;    // cách trên ~3.5%

    drawImageCover(ctx, imgThongthao, x, y, size, size);
  }


  // Layer 7: Phép bổ trợ
  const imgPhep = await loadImage("phepbotro/" + phep);
  if (imgPhep) drawImageCover(ctx, imgPhep, (canvas.width - 128) / 2, canvas.height - 166, 132, 132);

  // Layer 8: Tri kỷ
  const imgTriki = await loadImage("triki/" + triki);
  if (imgTriki) drawImageCover(ctx, imgTriki, 165, canvas.height - 185, 150, 150);

  // Layer 8.5: Phù hiệu
  const groupKey = phuhieuGroupSelect.value;
  const phuhieuFile = phuhieuSelect.value;
  if (phuhieuFile && phuhieuFile !== "none") {
    const imgPhuhieu = await loadImage("phuhieu/" + phuhieuFile);
    if (imgPhuhieu) drawImageCover(ctx, imgPhuhieu, canvas.width - 330, 1020, 160, 160);
  }

  // Layer 9: Tên tướng
  if (heroName) {
    let fontSize = 75;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    do {
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const textWidth = ctx.measureText(heroName).width;
      if (textWidth > 600) fontSize -= 1;
      else break;
    } while (fontSize > 10);

    const x = canvas.width / 2;
    const y = canvas.height - 328;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(heroName, x, y);
    ctx.fillStyle = "#3094ff";
    ctx.fillText(heroName, x, y);
  }

  // Layer 10: Tên skin
  if (skin?.displayName) {
    let fontSize = 75;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    do {
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      const textWidth = ctx.measureText(skin.displayName).width;
      if (textWidth > 630) fontSize -= 1;
      else break;
    } while (fontSize > 10);

    const x = canvas.width / 2;
    const y = canvas.height - 430;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(skin.displayName, x, y);
    ctx.fillStyle = "#ead39eff";
    ctx.fillText(skin.displayName, x, y);
  }

  // Layer 11: Tên game + SSM (icon bên trái, text bên phải, căn giữa)
  ctx.font = `68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = "middle";
  const nameY = canvas.height - 234;
  ctx.fillStyle = vienvangCheck.checked ? "#ffe092ff" : "#ffffff";

  const ssmValue = ssmSelect?.value || "none";

  if (ssmValue && ssmValue !== "" && ssmValue !== "none") {
    const imgSSM = await loadImage("ssm/" + ssmValue);
    if (imgSSM) {
      const iconSize = 170;
      const gap = 12;
      ctx.textAlign = "left";
      const text = nameGame || "";
      const textWidth = ctx.measureText(text).width;
      const totalWidth = iconSize + gap + textWidth;
      const startX = (canvas.width - totalWidth) / 2;

      // Vẽ icon SSM
      ctx.drawImage(imgSSM, startX, nameY - iconSize / 2, iconSize, iconSize);

      // Vẽ tên game
      ctx.fillText(text, startX + iconSize + gap, nameY);
    } else {
      // Fallback nếu không load được SSM
      ctx.textAlign = "center";
      ctx.fillText(nameGame, canvas.width / 2, nameY);
    }
  } else {
    // Không SSM → tên game giữa
    ctx.textAlign = "center";
    ctx.fillText(nameGame, canvas.width / 2, nameY);
  }
}

// ==================
// Tạo ảnh
// ==================
createBtn.addEventListener("click", async () => {
  createBtn.disabled = true;
  createBtn.textContent = "⏳ Đang tạo...";

  await drawCanvas();

  const imgData = canvas.toDataURL("image/png");

  // Xóa preview cũ nếu có
  document.getElementById("imgPreview")?.remove();

  const imgPreview = document.createElement("img");
  imgPreview.id = "imgPreview";
  imgPreview.src = imgData;
  imgPreview.alt = "Ảnh đã tạo";
  imgPreview.style.cssText = `
    width: 100%;
    max-width: 600px;
    display: block;
    margin: 40px auto;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    user-select: none;
    -webkit-user-select: none;
  `;

  saveBtn.parentNode.insertBefore(imgPreview, saveBtn);

  canvas.style.display = "none";
  saveBtn.style.display = "inline-block";

  createBtn.disabled = false;
  createBtn.textContent = "✨ Tạo ảnh";
});

// ==================
// Lưu ảnh (chỉ một lần)
// ==================
saveBtn.addEventListener("click", () => {
  const img = document.getElementById("imgPreview");
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/Zalo|FBAN|FBAV|TikTok/i.test(userAgent)) {
    alert(
      "Bạn đang mở bằng ứng dụng (Zalo/Facebook/TikTok...)\n\n" +
      "Vui lòng mở bằng trình duyệt (Chrome/Safari) hoặc giữ 2 giây vào ảnh để lưu."
    );
    return;
  }

  if (img) {
    const link = document.createElement("a");
    link.download = "khung-lien-quan-" + (new Date().toISOString().slice(0, 10)) + ".png";
    link.href = img.src;
    link.click();
  } else {
    alert("Chưa có ảnh để lưu.");
  }
});

// ==================
// Khởi tạo
// ==================
loadAllData();