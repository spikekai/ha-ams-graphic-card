/*
 * ams2pro-card —— 独立版「AMS 图形卡」（支持 AMS / AMS 2 PRO / AMS HT / AMS-3H 变体）
 * ============================================================================
 * v2.0.0 新增：
 *   ① 字体放大：材料标签 15→20，余量百分比 11→14（1× 设计单位）
 *   ② 编辑器 ams2pro-card-editor：编辑/新建卡片时可选择
 *      - AMS 设备（下拉，按厂商 Bambu Lab + 型号含 AMS 过滤）
 *      - 温度传感器 / 湿度传感器（默认「自动」= 从设备实体按 device_class 匹配）
 *      - 温湿度信息栏开关
 *   ③ 按 AMS 设备型号自动匹配卡面：
 *      AMS 2 Pro → /local/ams2pro/  AMS → /local/ams/  AMS HT → /local/ams-ht/
 *      AMS Lite  → 暂不支持（显示提示）
 *   ④ 选定设备后自动派生 tray_1..N 实体（device_registry 的 tray_* 实体）
 *   ⑤ AMS HT：窄卡 viewBox(x250..450)，料仓矢量盘 + LCD 实时绘制
 *      （Hum/Temp/Time，底图上烘焙的数字已擦除）
 *   ⑥ 兼容旧配置 tray_1..tray_4（此时按 AMS 2 PRO 渲染）
 *
 * 图层顺序：base.png → 矢量料盘(渐隐蒙版,仅 ams2pro) → 材料标签 → LCD(HT)
 * v2.3.0：温湿度图标放大到 19px 并加细节；「名称显示」开关联动「卡片名称」输入栏；
 *          添卡片选择器的缩略图（未配置态渲染 /local/ams2pro/card_thumb.png，customCards.preview=true）
 * v2.4.0：AMS HT 尺寸对齐 —— viewBox 收紧到设备本体 ([264.75,0,170,360] 宽 200→170 = 放大 1.18×)，
 *          网格锁定 rows:5（5×56+4×8 = 312px，与集成 AMS / AMS 2 PRO 图形卡等高，与浏览器宽度无关），
 *          内容用 flex 撑满卡片高度（SVG meet 自适应，不裁切）
 * v2.5.0：AMS / AMS 2 PRO 左右空白各裁掉 3/4（viewBox [45.75,0,607.75,360]，内容放大 1.152×），
 *          并锁定 rows:5 → 同宽度下高度 = 312px，与原集成 AMS / AMS 2 PRO 图形卡一致
 * v2.6.0：① 修复 .art 类加错元素（加到温度图标上）→ 主图 SVG 未参与 flex 布局，
            导致 AMS 卡图形贴顶留白、HT 卡图形超出被裁掉底部 1/3；
          ② AMS / AMS 2 PRO viewBox 改 [102.5, 6, 494, 350.5]：图形铺满图形区（零空白），
            图片实际高度 278px = AMS HT 的 278px
 * v2.7.0：AMS / AMS 2 PRO 恢复原始比例（零裁切）——图片高度靠「加宽卡片」实现
 *         （仪表盘 columns 12 → 17 ⇒ 394px → 561.5px，图片自然涨到 279.6px 满格）；
 *         AMS HT 图片等比例缩小 2.6%，使设备绘制高与 AMS 一致（270.7px），卡片高度不变
 * v2.8.0：① AMS HT 头部温湿度居中（.head.center）；
 *         ② 百分比黑框加宽并保证文字居中、100% 不溢出（量文字改用 --ha-font-family-body
 *            真实字体 + chipWidth 下限兜底；材料标签同口径）
 * v2.9.0：（已废弃）曾按「HT 卡 = 4 列」把 viewBox 定成 189.13
 * v2.10.0：AMS HT 图片高度对齐（用户 2026-09-27 第五次修订：**卡片尺寸不变，只等比例缩小图片**）
 *          HT 卡实测 159.5px 宽（5 列）× 312px 高，图形区 159.5 × 279.609 → 按「贴合高」缩放
 *          viewBox 整体等比放大 k = 1.17961 倍 → [237.96, -30.1, 223.1, 419.7]
 *          （中心保持 349.505 / 179.75，全部绝对坐标不变，纯画面缩放）
 *          → 缩放 = 279.609 / 419.7 = 0.66621 → 设备绘制高 = 344.5 × 0.66621 = 229.51px
 *            = AMS / AMS 2 PRO 的 348.5 × (461/700) = 229.51px ✓
 *          守卫：卡宽 ≥ 5 列时恒为「贴合高」→ 再拉宽（6/7/8 列）图片高度不变；
 *                4 列及以下会切成「贴合宽」，图片随之变小
 * v2.10.1：空盘位不再显示材料标签 —— 不画黑框、不写「空」，整块隐藏
 * v2.11.0：把「空盘位标签」做成编辑器开关（show_empty_label，默认隐藏）——
 *          隐藏 = 空盘位不画黑框也不写「空」；显示 = 恢复黑框 + 「空」
 * V1.1（2026-09-29）：补齐「在用料盘动画」——原集成「矢量」模式独有、图形卡缺失的两项效果：
 *          ① 摆动（wiggle）：材料带整体 skew(±2deg, ±2deg) 往返，模拟料盘受力轻微晃动的旋转感
 *          ② 高光反射（lightReflection）：一条白色渐变高光在材料带内自上而下往返扫描
 *          仅当该盘位 active / in_use 为真时启用；两个动画各有独立开关
 *          spool_anim_wiggle / spool_anim_reflection（默认均开启）
 *          实现要点：SVG 里对 <g> 施加 CSS transform 动画（配合 transform-box/origin），
 *                   高光用 <rect> + 线性渐变 + 位移动画，两者都在渐隐蒙版之内，
 *                   因此与现有渐隐、卡扣覆盖层、丝印层的图层关系完全不变。
 * V1.2（2026-09-29）：修正「摆动越框」——2° skew 会把材料带的可视包围盒由 85.85 撑到约 102
 *          设计单位，实测动画峰值越过白色轮缘约 1.7px。修法不是减小角度，而是
 *          给带动画的那一层加 clipPath，把可见范围裁到「轮缘内边界」(rx0 .. rx0+rw)，
 *          角度多大都不可能越框；同时保留原幅度的摆动观感。
 *          裁剪路径按每个在用料盘各生成一条（id 带序号），收集后并入 <defs>。
 * V1.3（2026-09-29）：**移除左右摆动**，改用三项「不产生水平位移」的视觉强调
 *          （用户反馈摆动观感不佳）：
 *          ① 呼吸光晕 halo        —— 沿轮缘一圈的柔光做明暗脉动（居中 scale 1→1.045）
 *          ② 轮缘发光 rimGlow     —— 两侧白色轮缘内侧压一条耗材色亮边，静态可辨
 *          ③ 高光扫描加强          —— 由纯纵向 0.22 透明度，改为带倾角、0.62~0.78 亮度、1.6s 更快节奏
 *          设计约束：主运动只用 scale（居中缩放）与 translateY（纵向位移），
 *          **不出现任何 skew / rotate / translateX** → 水平几何范围恒定，
 *          从物理上杜绝「越框」；clipPath 裁剪层保留作兜底。
 *          开关：spool_anim_halo / spool_anim_glow / spool_anim_reflection（默认全开）。
 *          旧配置里的 spool_anim_wiggle 键已废弃（残留也不影响渲染）。
 * V1.4（2026-09-29）：按用户观感反馈做四项调整 ——
 *          ① 闪烁幅度 -20%：光晕 scale 峰值 1.045→1.036、opacity 峰值 0.92→0.80；
 *             轮缘发光 opacity 峰值 0.62→0.56（均以 0% 关键帧为锚点收窄摆幅）
 *          ② 高光方向：渐变线由带横向偏移（视觉 45° 斜向）改为 x1=x2=0 的**纯 90° 垂直**
 *          ③ 高光运动：由「上下往返」改为**只朝下单向**扫过（关键帧只保留 0%/100%）
 *          ④ 高光速度 -50%：周期 1.6s → 3.2s；并去掉该元素的 opacity 脉动
 *          附带缺陷修复：高光原会「扫出材料带」露到带外的灰色区（半盘实测上下各溢出
 *             54.7 / 96.7px）。本次给高光外层加 clipPath 裁到材料带矩形，行程改 ±50%
 *             （亮带正好自上沿扫到下沿，整周期可见）。
 *          注：光晕/轮缘的发光明暗周期保持 2s 不变（用户只要求降幅度，未要求降速）。
 * V1.5–V1.8（2026-09-29，按观感逐轮微调）：
 *          光晕亮度 -30%（v1.5）；脉动范围 -40% 且循环接缝改到「中值」（v1.6）；
 *          消除「一出现就整块铺开」（v1.7）；光晕矩形加高 30% + 多余部分由裁剪隐藏
 *          + 单向下滑入场 + 脉动周期降速 35%（v1.8）。
 *          另：v1.8 起入场改由外层容器承担，与循环动画解耦，不再做相位握手。
 * =================== V1.0 定稿（2026-09-27） ===================
 * 版本号归正为 1.0（同时用作素材 URL 的 ?v= 缓存戳）；
 * V1.0 = v2.11.0 的行为 + 素材目录自适应（assetDir：按卡片 JS 所在目录推导，
 *        使同一个包在 /local/ 或 HACS 的 /hacsfiles/<repo>/ 下都能直接工作）
 * ==============================================================
 */
const AMS2PRO_VERSION = '1.28';
const A2P_MESSAGES = {
  "idle": {
    "zh": "待机",
    "en": "Idle"
  },
  "dryingZone": {
    "zh": "干燥区",
    "en": "Drying"
  },
  "empty": {
    "zh": "空",
    "en": "Empty"
  },
  "emptySlot": {
    "zh": "空槽",
    "en": "Empty slot"
  },
  "offline": {
    "zh": "离线",
    "en": "Offline"
  },
  "unknownMaterial": {
    "zh": "未知材料",
    "en": "Unknown material"
  },
  "unknownRemaining": {
    "zh": "余量未知",
    "en": "Remaining unknown"
  },
  "timeLeft": {
    "zh": "剩余时间",
    "en": "Time left"
  },
  "humidity": {
    "zh": "湿度",
    "en": "Humidity"
  },
  "temperature": {
    "zh": "温度",
    "en": "Temperature"
  },
  "entityMissing": {
    "zh": "实体不存在",
    "en": "Entity not found"
  },
  "slot": {
    "zh": "槽位 ",
    "en": "Slot "
  },
  "inUse": {
    "zh": " · 正在使用",
    "en": " · In use"
  },
  "unsupported": {
    "zh": "·暂不支持",
    "en": "· Not supported"
  },
  "spoolStatus": {
    "zh": " 料盘状态",
    "en": " spool status"
  },
  "cardName": {
    "zh": "AMS 图形卡（全机型）",
    "en": "AMS Card (all models)"
  },
  "preview": {
    "zh": "AMS 图形卡预览",
    "en": "AMS Card preview"
  },
  "device": {
    "zh": "AMS 设备",
    "en": "AMS device"
  },
  "showName": {
    "zh": "名称显示",
    "en": "Show name"
  },
  "nameHint": {
    "zh": "留空则不显示名称",
    "en": "Leave blank to hide the name"
  },
  "emptyLabel": {
    "zh": "空盘位标签",
    "en": "Empty slot label"
  },
  "infoBar": {
    "zh": "温湿度信息栏",
    "en": "Temperature & humidity bar"
  },
  "tempSensor": {
    "zh": "温度传感器",
    "en": "Temperature sensor"
  },
  "humSensor": {
    "zh": "湿度传感器",
    "en": "Humidity sensor"
  },
  "filter": {
    "zh": "筛选：输入名称或实体关键字（可留空）",
    "en": "Filter: type a name or entity keyword (optional)"
  },
  "activeTray": {
    "zh": "激活料盘",
    "en": "Active tray"
  },
  "leftChamber": {
    "zh": "左侧整舱（zone_2，剩余时间不显示）",
    "en": "Left chamber (zone_2, no time shown)"
  },
  "rightZone": {
    "zh": "右侧干燥区（zone_1）",
    "en": "Right drying zone (zone_1)"
  },
  "halo": {
    "zh": "在用盘呼吸光晕",
    "en": "In-use spool breathing halo"
  },
  "rim": {
    "zh": "在用盘轮缘发光",
    "en": "In-use spool rim glow"
  },
  "sheen": {
    "zh": "在用盘高光扫描",
    "en": "In-use spool sheen sweep"
  },
  "editorError": {
    "zh": "编辑器渲染出错：",
    "en": "Editor render error: "
  },
  "missingConfig": {
    "zh": "ams2pro-card：缺少配置",
    "en": "ams2pro-card: missing configuration"
  },
  "description": {
    "zh": "官方空仓底图 + 矢量料盘，自动匹配 AMS / AMS 2 PRO / AMS HT / AMS-3H 卡面，支持选择温湿度传感器",
    "en": "Official empty-spool base art plus vector spools; auto-matches AMS / AMS 2 PRO / AMS HT / AMS-3H layouts and supports picking temperature/humidity sensors"
  },
  "autoDevice": {
    "zh": "自动（跟随所选 AMS 设备）",
    "en": "Automatic (selected AMS device)"
  },
  "manual": {
    "zh": "手动选择",
    "en": "Select manually"
  },
  "deviceHint": {
    "zh": "选择后自动匹配卡面（AMS / AMS 2 PRO / AMS HT / AMS-3H）并带出对应料盘实体",
    "en": "Automatically selects the AMS / AMS 2 PRO / AMS HT / AMS-3H layout and its tray entities."
  },
  "sensorHint": {
    "zh": "「自动」= 按所选 AMS 设备的实体类型匹配；「手动」可从全 HA 的温度/湿度实体中筛选",
    "en": "Automatic matches sensor types on the selected AMS; manual selection searches all HA temperature/humidity entities."
  },
  "show": {
    "zh": "显示",
    "en": "Show"
  },
  "hide": {
    "zh": "隐藏",
    "en": "Hide"
  },
  "title": {
    "zh": "卡片名称",
    "en": "Card name"
  },
  "hideDefault": {
    "zh": "隐藏（默认）",
    "en": "Hide (default)"
  },
  "showEmpty": {
    "zh": "显示黑框 + 「空」",
    "en": "Show a dark label with “Empty”"
  },
  "emptyHint": {
    "zh": "「隐藏」时空盘位不画黑框也不写「空」；只有该盘位有料才显示材料标签",
    "en": "When hidden, empty slots have no label; material labels appear only for loaded slots."
  },
  "onDefault": {
    "zh": "开启（默认）",
    "en": "On (default)"
  },
  "off": {
    "zh": "关闭",
    "en": "Off"
  },
  "haloHint": {
    "zh": "在用料盘沿轮缘一圈做明暗「呼吸」脉动，居中缩放，不会超出料盘外框",
    "en": "A breathing halo pulses around the in-use spool rim, staying inside its outline."
  },
  "rimHint": {
    "zh": "两侧白色轮缘内侧压一条耗材色亮边，静态即可一眼认出在用料盘",
    "en": "A material-colored highlight inside the rims identifies the in-use spool."
  },
  "sheenHint": {
    "zh": "一条斜向高光在材料带内往返扫描，加强「流动感」",
    "en": "A highlight sweeps back and forth inside the material band."
  },
  "unselected": {
    "zh": "（未选择）",
    "en": "(Not selected)"
  },
  "auto": {
    "zh": "（自动）",
    "en": "(Automatic)"
  },
  "current": {
    "zh": "（当前）",
    "en": "(Current)"
  },
  "autoOwned": {
    "zh": "自动（设备归属）",
    "en": "Automatic (device entities)"
  },
  "fieldsHint": {
    "zh": "AMS-3H 仅显示核心区；名称及旧料盘动画设置仍保留，切回其它机型继续生效。留空自动按设备归属匹配；不能唯一匹配时请选择实体。",
    "en": "AMS-3H shows the core layout only. Name and spool animation settings remain available for other models. Leave fields blank to match device entities automatically; select an entity if the match is ambiguous."
  },
  "notSupportedPrefix": {
    "zh": "暂不支持 ",
    "en": "Not supported: "
  },
  "supportedSuffix": {
    "zh": " 卡面（当前支持 AMS / AMS 2 PRO / AMS HT / AMS-3H）",
    "en": " layout (supported: AMS / AMS 2 PRO / AMS HT / AMS-3H)"
  },
  "chooseDevice": {
    "zh": "请在卡片编辑器中选择 AMS 设备，自动匹配 AMS / AMS 2 PRO / AMS HT / AMS-3H 卡面",
    "en": "Select an AMS device in the card editor to match its AMS / AMS 2 PRO / AMS HT / AMS-3H layout."
  },
  "dryingStatus": {
    "zh": "烘干中",
    "en": "Drying"
  }
};
function a2pLanguage(hass) {
  const language = hass?.locale?.language || hass?.language || globalThis.navigator?.language || 'en';
  return /^zh/i.test(language) ? 'zh' : 'en';
}
function a2pText(hass, key) { return A2P_MESSAGES[key][a2pLanguage(hass)] || A2P_MESSAGES[key].en; }
function a2pRegister(hass) {
  const card = window.customCards?.find(c => c.type === 'ams2pro-card');
  if (card) { card.name = a2pText(hass, 'cardName'); card.description = a2pText(hass, 'description'); }
}

const AMS2PRO_SVG = 'http://www.w3.org/2000/svg';

/* ---- 每机型几何（1× 设计单位）----
 * geo: centers 料盘中心 x（相对 viewBox）
 *      spW/spH/spY 料盘宽/高/顶；bandCY 材料带中心；matCap 满带占比
 *      labelY 标签行；flangeFrac 轮缘宽占比
 *      fade: 'a2p' = 用 AMS2PRO 渐隐蒙版；'none' = 不透明
 *      vb: [x,y,w,h] viewBox；缺省 [0,0,700,360]
 */
const VARIANTS = {
  ams3h: { name: 'AMS-3H', vb: [152, 64, 1096, 532], dir: null },
  ams2pro: {
    dir: '/local/ams2pro', name: 'AMS 2 PRO',
    /* 【不再裁切/缩放图片】用整张素材：viewBox 缺省 = [0,0,700,360]，设备原始比例 100% 保留。
       图片变大的办法是「把卡片加宽」：卡宽 = 33.5×columns − 8（HA sections 每个网格列 25.5px、间隙 8px），
       仪表盘里这些卡的 columns 设为 17 → 卡宽 561.5px → 图形区 561.5×312，
       图片按宽高比缩放到 543.7×279.6（吃满图形区高度），设备绘制高 270.7px */
    centers: [155.75, 284.5, 414.25, 542.75],
    spW: 101, spH: 265, spY: 19, flangeFrac: 0.075,
    bandCY: 150, matCap: 0.9, labelY: 268, fade: 'a2p', layers: true,
  },
  ams: {
    /* AMS（v1）：按用户要求弃用粗糙的旧底图，改为 AMS 2 PRO 素材 + 标签「…AMS」，
       几何/图层/渐隐完全沿用 AMS 2 PRO（料盘位置一致），只是素材目录不同 */
    dir: '/local/ams', name: 'AMS',
    /* 【不再裁切/缩放图片】用整张素材：viewBox 缺省 = [0,0,700,360]，设备原始比例 100% 保留。
       图片变大的办法是「把卡片加宽」：卡宽 = 33.5×columns − 8（HA sections 每个网格列 25.5px、间隙 8px），
       仪表盘里这些卡的 columns 设为 17 → 卡宽 561.5px → 图形区 561.5×312，
       图片按宽高比缩放到 543.7×279.6（吃满图形区高度），设备绘制高 270.7px */
    centers: [155.75, 284.5, 414.25, 542.75],
    spW: 101, spH: 265, spY: 19, flangeFrac: 0.075,
    bandCY: 150, matCap: 0.9, labelY: 268, fade: 'a2p', layers: true,
  },
  ht: {
    dir: '/local/ams-ht', name: 'AMS HT',
    /* viewBox（用户 2026-09-27 第五次修订：卡片尺寸不变，等比例缩小图片使高度与 AMS 一致）
       实测基线：AMS / AMS 2 PRO 卡 = 461px 宽（14 列），图形区 461×278，
                 按「贴合宽」缩放 461/700 = 0.65857 → 设备绘制高 = 348.5 × 0.65857 = 229.51px
       HT 现状：159.5px 宽（5 列），图形区 159.5×279.609，按「贴合高」缩放
                → 旧 viewBox 缩放 0.78586 → 设备绘制高 270.7px（比 AMS 高 41px）
       HT 目标：设备绘制高 = 229.51px → 需要缩放 229.51 / 344.5 = 0.66621
                → viewBox 高 = 279.609 / 0.66621 = 419.7（旧 355.8 的 1.17961 倍）
                → viewBox 宽等比 = 189.13 × 1.17961 = 223.1，中心保持 (349.505, 179.75)
       效果：设备绘制 108.6 × 229.51px，卡片两侧各余约 25.5px 空白（几何必然，非裁切）
       ★ 卡宽 ≥ 5 列恒为「贴合高」；4 列及以下会切成「贴合宽」导致图片变小 */
    vb: [237.96, -30.1, 223.1, 419.7],
    /* 料盘几何（用户 2026-09-27 第二次修订）：
       顶部保持上一版高度 spY=24，高度拉高一倍 146→292（末端 316），
       材料带中心 = 料盘中点 168（≈AMS2PRO 的 50% 比例），
       clipY=177：过了罩子/银色卡扣的部分被遮挡不可见 */
    centers: [114.04], spW: 111, spH: 292, spY: 24, flangeFrac: 0.075,
    bandCY: 168, matCap: 0.9, labelY: 265, fade: 'none', lcd: true,
    clipY: 168, chipMaxY: 152,
    bandTop: 163, bandBot: 184,   // 银色卡扣/罩子交界带：恢复并置顶（不透明）
    /* LCD 只留温湿度（第三格 Time 已去掉），放大并居中；绝对坐标保持 323 / 379 */
    lcdFields: [                       // 本地坐标（x 相对 vb[0] = 237.96）
      { key: 'hum', label: 'humidity', x: 85.04, lx: 85.04 },
      { key: 'temp', label: 'temperature', x: 141.04, lx: 141.04 },
    ],
    lcdLabelY: 205, lcdValueY: 224, lcdLabelFont: 8, lcdValueFont: 14,
  },
  lite: { dir: null, name: 'AMS Lite', unsupported: true },
};

/* 料盘竖直透明度（仅 ams2pro）：上半段全显，下半段渐隐进底图暗腔 */
const FADE_STOPS = [
  [0.0, 1.0],
  [140 / 360, 1.0],
  [160 / 360, 0.627],
  [180 / 360, 0.251],
  [190 / 360, 0.251],
  [260 / 360, 0.125],
  [330 / 360, 0.0],
  [1.0, 0.0],
];

const FONT_STACK =
  'var(--ha-font-family-body, "Segoe UI", Roboto, "Helvetica Neue", "Microsoft YaHei", sans-serif)';

const DEFAULT_ASSET_PATH = '/local/ams2pro';

/* 素材目录解析（V1.0 为「可提交的独立包」补）：
   ① 配置项 asset_path 最优先
   ② 否则按卡片 JS 自身所在目录推导同级素材目录 —— 同一个包放在
      /local/ 或 HACS 的 /hacsfiles/<repo>/ 下都能找到素材
      （仅 http(s) 生效；Node/jsdom 下 import.meta.url 是 file: 协议 → 回退内置默认）
   ③ 最后回退内置默认 /local/ams2pro
   例：卡片在 /local/ams2pro-card.js → /local/ams2pro ✓（与旧行为完全一致）
       卡片在 /hacsfiles/ams2pro-card/ams2pro-card.js → /hacsfiles/ams2pro-card/ams2pro ✓ */
const MODULE_BASE = (() => {
  try {
    const u = new URL('.', import.meta.url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.pathname.replace(/\/+$/, '');
  } catch (e) { return ''; }
})();

function assetDir(geo) {
  if (geo && geo.dir) {
    const sub = geo.dir.split('/').filter(Boolean).pop();   // 'ams2pro' / 'ams' / 'ams-ht'
    if (MODULE_BASE && sub) return MODULE_BASE + '/' + sub;
    return geo.dir;
  }
  return DEFAULT_ASSET_PATH;
}
const LABEL_FONT = 20;   // 材料标签
const PCT_FONT = 21;     // 余量百分比（用户要求放大 1.5 倍：14 → 21）
const EMPTY_LABEL = 'empty';   // 空盘位标签文字（仅在 show_empty_label 开启时绘制）

const _mcv = document.createElement('canvas');
const _mctx = _mcv.getContext('2d');
let _fontFam = '';
/* 取 HA 实际使用的正文字体：SVG 里 text 用的是 var(--ha-font-family-body)，
   若量文字时用写死的 fallback 字体，量出的宽度会偏窄 → "100%" 会溢出黑框 */
function fontFamily() {
  if (_fontFam) return _fontFam;
  let f = '';
  try {
    f = getComputedStyle(document.documentElement).getPropertyValue('--ha-font-family-body').trim();
  } catch (e) { /* ignore */ }
  _fontFam = f || '"Segoe UI", Roboto, "Microsoft YaHei", sans-serif';
  return _fontFam;
}
function measureText(text, size, weight) {
  const t = String(text);
  _mctx.font = `${weight || 400} ${size}px ${fontFamily()}`;
  const w = _mctx.measureText(t).width;
  return w > 0 ? w : t.length * size * 0.62;
}
/* 标签底框宽度：量出的宽度 + 余量，并保证不小于「按字符数估算」的下限，
   这样即使字体度量有差异，文字也一定被框住（黑框只加宽、不改字号） */
function chipWidth(text, size, extra, perChar) {
  const t = String(text);
  const w = measureText(t, size);
  return Math.max(w + (extra == null ? 18 : extra), t.length * size * (perChar == null ? 0.72 : perChar));
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isBlankColor(c) {
  if (!c) return true;
  const s = String(c).toLowerCase().replace('#', '').trim();
  return s === '' || s === '00000000' || s === '000000' || s === 'none' || s === 'nil';
}

function remainPct(slot) {
  if (slot.empty) return 20;
  const r = slot.remain;
  if (r == null || r < 0 || Number.isNaN(r)) {
    if (slot.spoolPct != null && isFinite(slot.spoolPct)) return 20 + (slot.spoolPct / 100) * 75;
    return 95;
  }
  return 20 + (r / 100) * 75;
}

/* 由设备型号字符串判定变体 */
function variantFromModel(model) {
  const m = String(model || '').toLowerCase();
  if (/\bams[\s_-]*3h\b/i.test(m)) return 'ams3h';
  if (m.includes('lite')) return 'lite';
  if (m.includes('ht')) return 'ht';
  if (m.includes('2')) return 'ams2pro';
  if (m.includes('ams')) return 'ams';
  return 'ams2pro';
}


/* AMS-3H: 仅从设备/关联实体的型号元数据识别，不猜实体名和槽数。 */
function amsDeviceModel(dev, hass) {
  if (!dev) return '';
  if (/ams/i.test(dev.model || '')) return dev.model;
  const attrs = Object.entries(hass?.entities || {}).filter(([,e]) => e.device_id === dev.id)
    .map(([id]) => hass.states?.[id]?.attributes || {});
  return attrs.flatMap(a => [a.device_model, a.model, a.device_type]).find(m => /\bams[\s_-]*3h\b/i.test(m || '')) || dev.model || '';
}
const ams3hAvailable = s => !!s && !['unknown','unavailable'].includes(s.state) && !s.attributes?.restored;
const ams3hValidColor = c => typeof c === 'string' && /^#[\da-f]{6}([\da-f]{2})?$/i.test(c);
const ams3hTrue = v => v === true || v === 'true';
  function ams3hSlotData(state, entity, number, hass) {
    const a = state?.attributes || {};
    const offline = !ams3hAvailable(state);
    const empty = !offline && (ams3hTrue(a.unknown) || ams3hTrue(a.empty) || a.type === 'Empty' || String(a.color).toUpperCase() === '#00000000');
    const remain = a.remain == null ? -1 : Number(a.remain);
    const amount = !Number.isFinite(remain) || remain < 0 ? 95 : 20 + Math.max(0, Math.min(100, remain)) * 0.75;
    return { entity, number, offline, empty, amount, name: a.name || a.type || '',
      material: offline ? a2pText(hass, "offline") : empty ? a2pText(hass, "emptySlot") : a.type || a2pText(hass, "unknownMaterial"),
      color: ams3hValidColor(a.color) ? a.color : '#888888',
      colors: Array.isArray(a.cols) ? a.cols.filter(ams3hValidColor).slice(0, 8) : [],
      remaining: Number.isFinite(remain) && remain >= 0 ? `${Math.min(100, remain)}%` : a2pText(hass, "unknownRemaining") };
  }
  // 按实体 ID、一基槽号、tray_N、slot 或唯一且非零的 tray_uuid 匹配。
  // 不按颜色/耗材名匹配，不借用各槽 active 标记，避免多个工具同时高亮。
  function ams3hActiveNumber(state, cfg) {
    if (!ams3hAvailable(state) || ['none', '', '?'].includes(String(state.state).toLowerCase())) return 0;
    const value = String(state.state);
    const entityIndex = cfg.trays.indexOf(value);
    if (entityIndex >= 0) return entityIndex + 1;
    const match = value.match(/^(?:tray_)?([1-9])$/);
    if (match) return Number(match[1]);
    const slot = Number(state.attributes?.slot);
    if (Number.isInteger(slot) && slot >= 1 && slot <= 9) return slot;
    // HA 的 active_tray.state 可能是材料名；用料卷身份匹配，不能按颜色/名字猜。
    const uuid = String(state.attributes?.tray_uuid || '').replace(/-/g,'').toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(uuid) || /^0+$/.test(uuid)) return 0;
    const matches = cfg.trays.map((id,i) => ({i, state:cfg.states?.[id]})).filter(t =>
      ams3hAvailable(t.state) && String(t.state.attributes?.tray_uuid || '').replace(/-/g,'').toLowerCase() === uuid);
    return matches.length === 1 ? matches[0].i + 1 : 0;
  }
  const ams3hText = (x, y, value, size = 24, attrs = '') => `<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${esc(value)}</text>`;

class Ams2ProCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._sig = '';
    this._preloadedPath = '';
    this._clipDefs = '';   // 每个在用料盘一条裁剪路径（收集后并入 <defs>）
    this._vfade = false;   // 是否需要纵向渐隐遮罩（收窄在用料盘强调的高度）
  }

  static getStubConfig() {
    return { type: 'custom:ams2pro-card' };
  }

  setConfig(config) {
    if (!config) throw new Error(a2pText(this?._hass, "missingConfig"));
    const trays = Array.isArray(config.trays)
      ? config.trays.slice(0, 4)
      : [config.tray_1, config.tray_2, config.tray_3, config.tray_4];
    this._config = Object.assign(
      {
        asset_path: '',
        show_labels: true,
        label_mode: 'type',
        show_empty_label: false,     // 空盘位是否显示黑框 + 「空」（默认隐藏）
        spool_anim_glow: true,       // 在用料盘：轮缘描边发光（跟随耗材颜色）
        spool_anim_halo: true,       // 在用料盘：呼吸光晕（沿轮缘一圈的明暗脉动）
        spool_anim_reflection: true, // 在用料盘：高光斜向扫描（加强版 lightReflection）
        title: '',
        show_title: true,
        show_info_bar: true,
        ams_device: '',
        temperature_entity: '',
        humidity_entity: '',
      },
      config,
      { trays }
    );
    this._sig = '';
  }

  set hass(hass) {
    this._hass = hass;
    a2pRegister(hass);
    this._update();
  }

  getCardSize() {
    if (this._variantKey === 'ams3h') return 6;
    return this._variantKey === 'ht' ? 6 : 4;   // HT ≈312px
  }

  getGridOptions() {
    if (this._variantKey === 'ams3h') return { columns: 'full', min_columns: 6, rows: 5, min_rows: 5 };
    /* HT：宽度 4 列不变，高度锁定 5 行 → 5×56 + 4×8 = 312px，
       与仪表盘里集成 AMS / AMS 2 PRO 图形卡（同 5 行）完全等高，且与浏览器宽度无关 */
    return this._variantKey === 'ht'
      ? { columns: 4, min_columns: 3, max_columns: 6, rows: 5, min_rows: 5 }
      /* AMS / AMS 2 PRO：整节宽 + 同样锁 5 行 → 高度 312px，
         与集成 graphic 卡（grid_rows 4+1=5）完全一致 */
      : { columns: 'full', min_columns: 6, rows: 5, min_rows: 5 };
  }

  connectedCallback() {
    this._update();
    if (!this._zoneResizeObserver) this._zoneResizeObserver = new ResizeObserver(() => {
      if (this._variantKey === 'ams3h') this._fitAms3hZones();
    });
    this._zoneResizeObserver.observe(this);
  }

  disconnectedCallback() {
    this._zoneResizeObserver?.disconnect();
  }

  static async getConfigElement() {
    if (!customElements.get('ams2pro-card-editor')) {
      // 已在本文件底部定义；等待其就绪
      await customElements.whenDefined('ams2pro-card-editor');
    }
    return document.createElement('ams2pro-card-editor');
  }

  /* ---------- 配置解析 ---------- */
  _deviceEntities(deviceId) {
    if (!deviceId || !this._hass || !this._hass.entities) return [];
    const out = [];
    for (const [eid, ent] of Object.entries(this._hass.entities)) {
      if (ent.device_id === deviceId && !ent.disabled_by) out.push(eid);
    }
    return out.sort();
  }

  _resolve() {
    const cfg = this._config;
    const hass = this._hass;
    const r = {
      variantKey: 'ams2pro',
      geo: VARIANTS.ams2pro,
      dir: cfg.asset_path ? cfg.asset_path.replace(/\/$/, '') : DEFAULT_ASSET_PATH,
      trays: [],
      tempEntity: cfg.temperature_entity || '',
      humEntity: cfg.humidity_entity || '',
      dryEntity: '',
      deviceName: '',
    };
    const dev = cfg.ams_device && hass && hass.devices ? hass.devices[cfg.ams_device] : null;
    if (dev) {
      r.variantKey = variantFromModel(amsDeviceModel(dev, hass));
      r.deviceName = dev.name_by_user || dev.name || '';
      r.geo = VARIANTS[r.variantKey];
      if (r.geo && r.geo.dir && !cfg.asset_path) r.dir = assetDir(r.geo);
      const ents = this._deviceEntities(cfg.ams_device);
      // tray 实体：优先 ams_device 派生；无则退回显式 trays
      const trayEnts = ents
        .filter((e) => /_tray_\d+$/.test(e) && hass.states[e])
        .sort((a, b) => (Number(a.match(/_tray_(\d+)$/)[1]) - Number(b.match(/_tray_(\d+)$/)[1])));
      if (trayEnts.length) r.trays = trayEnts;
      // 温湿度：显式配置优先，否则按 device_class / 命名匹配
      const dc = (e) => (hass.states[e] && hass.states[e].attributes
        ? hass.states[e].attributes.device_class : '') || '';
      if (!r.tempEntity) {
        r.tempEntity = ents.find((e) => dc(e) === 'temperature') ||
          ents.find((e) => /_temperature$/.test(e)) || '';
      }
      if (!r.humEntity) {
        r.humEntity = ents.find((e) => dc(e) === 'humidity') ||
          ents.find((e) => /_humidity$/.test(e) && !/_index$/.test(e)) || '';
      }
      r.dryEntity = ents.find((e) => /_remaining_drying_time$/.test(e)) || '';
    }
    if (!r.trays.length) r.trays = (cfg.trays || []).filter(Boolean);
    if (r.variantKey === 'ams3h') this._resolveAms3h(r, dev);
    return r;
  }


  _resolveAms3h(r, dev) {
    const cfg = this._config, states = this._hass.states;
    const ents = this._deviceEntities(cfg.ams_device);
    // 空槽/缺实体必须保留原槽号，不因数组 filter 发生错位。
    r.trays = Array.from({length:9}, (_,i) => cfg.ams3h_trays?.[i] || ents.find(id => {
      const slot = states[id]?.attributes?.slot;
      return /_tray_\d+$/.test(id) && Number(slot ?? id.match(/_tray_(\d+)$/)[1]) === i+1;
    }) || '');
    r.zones = [1,2].map(z => Object.fromEntries(['temperature','humidity','remaining_drying_time'].map(key => {
      const configured = cfg['zone_'+z+'_'+key+'_entity'] || (z === 1 && key === 'temperature' ? cfg.temperature_entity : z === 1 && key === 'humidity' ? cfg.humidity_entity : '');
      const matches = ents.filter(id => {
        const a=states[id]?.attributes || {};
        return new RegExp('_zone_'+z+'_'+key+'$').test(id) || (Number(a.zone)===z && (a.device_class===key || a.sensor_type===key));
      });
      return [key, configured || (matches.length===1 ? matches[0] : '')];
    })));
    const parent = dev?.via_device_id;
    const activeCandidates = parent ? this._deviceEntities(parent).filter(id => /_active_tray$/.test(id)) : [];
    r.activeEntity = cfg.active_tray_entity || (activeCandidates.length===1 ? activeCandidates[0] : '');
    const printCandidates = parent ? this._deviceEntities(parent).filter(id => /_print_status$/.test(id)) : [];
    r.printStatusEntity = printCandidates.length===1 ? printCandidates[0] : '';
    const toolEntities = parent ? Object.entries(this._hass.entities || {}).filter(([id, entity]) => {
      const device = this._hass.devices?.[entity.device_id];
      return !entity.disabled_by && (entity.device_id === parent || device?.via_device_id === parent)
        && /_printtool_\d+$/.test(id);
    }).map(([id]) => id) : [];
    r.tools = Array.from({length:9}, (_,i) => {
      const matches = toolEntities.filter(id => Number(states[id]?.attributes?.tool) === i+1);
      return matches.length === 1 ? matches[0] : '';
    });
  }
  _updateAms3h(r) {
    const states=this._hass.states, cfg=this._config;
    const ids=[...r.trays,...r.tools,r.activeEntity,r.printStatusEntity,...r.zones.flatMap(z=>Object.values(z))];
    const sig=JSON.stringify([a2pLanguage(this._hass),r,cfg,ids.map(id=>states[id])]);
    if(sig===this._sig)return;
    this._sig=sig;this._resolved=r;
    const slots=r.trays.map((id,i)=>ams3hSlotData(states[id],id,i+1,this._hass));
    const printing = states[r.printStatusEntity];
    let active=ams3hAvailable(printing) && ['prepare','running'].includes(printing.state)
      ? ams3hActiveNumber(states[r.activeEntity],{trays:r.trays,states}) : 0;
    if(active && (slots[active-1].offline || slots[active-1].empty))active=0;
    this._renderAms3h(r,slots,active);
  }
  _ams3hDrying(z) {
    const entities = ['temperature','humidity','remaining_drying_time']
      .map(key => this._hass.states[z[key]]).filter(ams3hAvailable);
    const duration = entities.map(e => e.attributes?.dry_setting?.dry_duration).find(v => v != null);
    const slotEntity = entities.find(e => e.attributes?.slots !== undefined);
    const slots = slotEntity ? slotEntity.attributes.slots : [6,8];
    return { active: Number(duration) > 0,
      slots: new Set((Array.isArray(slots) ? slots : []).filter(v => Number.isInteger(v) && v >= 1 && v <= 9)) };
  }
  _ams3hZone(z, number, x) {
    const states=this._hass.states;
    const value=(key,unit)=>ams3hAvailable(states[z[key]]) ? states[z[key]].state+(states[z[key]].attributes?.unit_of_measurement || unit) : '—';
    const isDryingZone = number === 2; // 右侧为 zone_1；左侧整舱 zone_2 不显示烘干信息。
    const heating = isDryingZone && this._ams3hDrying(z).active;
    const remaining=states[z.remaining_drying_time];
    const drying=heating && ams3hAvailable(remaining) && Number(remaining.state)>0 ? value('remaining_drying_time','') : '';
    // v1.14：以 y=86 为缩放基点，整块放大 40%；九槽几何保持不变。
    const zoneScale = 1.4, zoneX = number === 1 ? 182 : 1117;
    return '<g class="zone" transform="translate('+zoneX+' 86) scale('+zoneScale+') translate('+(-x)+' -86)">'+(isDryingZone ? ams3hText(x + 8 / zoneScale,106,a2pText(this?._hass, "dryingZone"),16,'class="zone-title"') : '')+
      '<g class="zone-humidity"'+(isDryingZone ? ' data-center="'+(x + 109.08 / zoneScale / 2)+'"' : '')+'>'+Ams2ProCard.humidityIcon(states[z.humidity]?.state, 'x="'+(x+1)+'" y="130" data-x="'+(x+1)+'"')+
      ams3hText(x+28,150,value('humidity','%'),23)+'</g>'+ams3hText(x,188,value('temperature','°C'),23,'class="zone-temperature"'+(heating ? ' style="fill:var(--a2p-drying-temperature)"' : ''))+(drying ? ams3hText(x,222,drying,17,'class="zone-time"') : '')+'</g>';
  }
  _renderAms3h(r,slots,active) {
    const drying = this._ams3hDrying(r.zones[0]);
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;height:100%;
        --a2p-panel:var(--ha-card-background,var(--card-background-color,#242424));
        --a2p-slot-outline:color-mix(in srgb,var(--secondary-text-color,#888) 72%,var(--a2p-panel));
        --a2p-text:var(--primary-text-color,#ddd);
        --a2p-secondary:var(--secondary-text-color,#888);
        --a2p-accent:var(--primary-color,#bbf747);
        --a2p-warm:var(--ams3h-drying-color,var(--warning-color,#ffa340));
        --a2p-drying-temperature:var(--ams3h-drying-temperature-color,var(--error-color,#ff4d4f));
      }ha-card{display:flex;flex-direction:column;justify-content:center;height:100%;min-height:312px;padding:12px 0;box-sizing:border-box;overflow:hidden;background:var(--a2p-panel);border:0;border-radius:16px}
      .art{display:block;flex:none;width:100%;height:auto;aspect-ratio:1096/532;color:var(--a2p-text);font-family:var(--ha-font-family-body,"Segoe UI","Microsoft YaHei",sans-serif)}
      text{fill:currentColor;pointer-events:none}.slot{color:#ddd;cursor:pointer}.slot-frame{fill:#131313;stroke:var(--a2p-slot-outline);stroke-width:1;vector-effect:non-scaling-stroke}
      .slot-number{fill:#404040;stroke:#777;stroke-width:.6;vector-effect:non-scaling-stroke}
      .dimmed > .slot-frame,.dimmed > .slot-number{opacity:1}
      .slot.active .slot-frame{stroke:#eee}.dimmed{opacity:1}.dimmed > :not(text):not(.slot-frame):not(.slot-number):not(.drying-indicator):not(.drying-frame):not(.spool),.dimmed.empty > .spool,.dimmed.offline > .spool{opacity:.32}.offline{color:#888}
      .tube{fill:none;stroke:var(--a2p-secondary);stroke-width:4;stroke-dasharray:8 8}.feed.active .tube{stroke:var(--feed-color);stroke-width:6;stroke-dasharray:none}
      .tool-frame{fill:none;stroke:transparent}.feed.active .tool-frame{stroke:var(--a2p-text);stroke-width:2;vector-effect:non-scaling-stroke}
      .feed.active .tool > path:not(:last-child){stroke:var(--a2p-text);stroke-width:1.5}.tool-filament{fill:none;stroke:var(--feed-color);stroke-width:6;stroke-linecap:round}
      .tool > path:not(:last-child){stroke:var(--a2p-text);stroke-width:1;stroke-linejoin:round}.zone{color:var(--a2p-text)}
      .nozzle-sizes{transform:translateY(10px);display:block;flex:none;width:100%;height:auto;aspect-ratio:1096/44;color:var(--a2p-text);font-family:var(--ha-font-family-body,"Segoe UI","Microsoft YaHei",sans-serif)}
      .nozzle-size rect{fill:var(--a2p-panel);stroke:var(--a2p-slot-outline);stroke-width:1;vector-effect:non-scaling-stroke}
      .drying-frame{fill:none;stroke:var(--a2p-warm);stroke-width:2;pointer-events:none;stroke-opacity:.7;animation:a2pDrying 2.8s linear infinite}
      .drying-indicator{pointer-events:visiblePainted}
      @keyframes a2pDrying{0%,100%{stroke-opacity:.7;animation-timing-function:ease-out}25%{stroke-opacity:1;animation-timing-function:ease-in}50%{stroke-opacity:.7;animation-timing-function:ease-out}75%{stroke-opacity:.4;animation-timing-function:ease-in}}
      @media(prefers-reduced-motion:reduce){.drying-frame{animation:none}}
      .slot:focus-visible{outline:3px solid var(--a2p-accent)}
      </style><ha-card><svg class="art ams3h-art" viewBox="152 64 1096 532" xmlns="http://www.w3.org/2000/svg" aria-label="AMS-3H${a2pText(this?._hass, "spoolStatus")}">
      <defs><linearGradient id="spool-shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>
      <rect x="152" y="64" width="1096" height="532" rx="18" fill="var(--a2p-panel)"/>
      <path d="M152 496H1248V578Q1248 596 1230 596H170Q152 596 152 578Z" fill="none"/>
      ${this._config.show_info_bar !== false ? [r.zones[1],r.zones[0]].map((z,i)=>this._ams3hZone(z,i+1,i ? 1120 : 177)).join('') : ''}
      ${slots.map(s=>this._ams3hPath(s,s.number===active)).join('')}
      ${slots.map(s=>this._ams3hSlot(s,s.number===active,!!active,drying.active && drying.slots.has(s.number))).join('')}
      </svg><svg class="nozzle-sizes" viewBox="152 0 1096 44" xmlns="http://www.w3.org/2000/svg">
      ${r.tools.map((id,i) => {
        const tool = this._hass.states[id], diameter = Number(tool?.attributes?.nozzle_diameter);
        const value = ams3hAvailable(tool) && tool.state !== 'empty' && Number.isFinite(diameter) && diameter > 0 ? String(diameter) : '';
        const x = 284 + i * 104;
        return '<g class="nozzle-size" data-tool="'+(i+1)+'"><rect x="'+(x-29)+'" y="3" width="58" height="34" rx="6"/>'+ams3hText(x,21,value,23,'text-anchor="middle" dominant-baseline="middle"')+'</g>';
      }).join('')}
      </svg></ha-card>`;
    requestAnimationFrame(() => this._fitAms3hZones());
    this.shadowRoot.querySelectorAll('.slot').forEach(el=>{
      const open=()=>{if(el.dataset.entity)this._openFilamentPopup(el.dataset.entity);};
      el.addEventListener('click',open);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  _fitAms3hZones() {
    this.shadowRoot.querySelectorAll('.zone-humidity').forEach(el => {
      el.removeAttribute('transform');
      const factor = el.getScreenCTM()?.a;
      if (!(factor > 0) || !el.getBBox().width) return;
      const icon = el.querySelector('.humidity-icon'), text = el.querySelector('text');
      const size = 19 / factor, gap = 4 / factor, x = Number(icon.dataset.x);
      icon.setAttribute('width', size); icon.setAttribute('height', size);
      icon.setAttribute('y', 142 - size / 2);
      text.setAttribute('x', x + size + gap);
      text.removeAttribute('textLength'); text.removeAttribute('lengthAdjust');
      text.setAttribute('font-size', 23);
      const available = Math.max(1, 109.08 / 1.4 - size - gap);
      if (text.getBBox().width > available) {
        text.setAttribute('font-size', 23 * available / text.getBBox().width);
      }
      const box = el.getBBox();
      const offset = el.dataset.center ? Number(el.dataset.center)-(box.x+box.width/2) : -5 / factor;
      el.setAttribute('transform', 'translate('+offset+' 0)');
    });
    this.shadowRoot.querySelectorAll('.zone-temperature,.zone-time').forEach(el => {
      if (el.getBBox().width > 109.08/1.4) { el.setAttribute('textLength',109.08/1.4); el.setAttribute('lengthAdjust','spacingAndGlyphs'); }
    });
  }

    _ams3hSlot(s, active, hasActive, drying) {
      const x = 284 + (s.number - 1) * 104, y = s.number % 2 === 0 ? 80 : 292;
      const cls = `slot${drying ? ' drying' : ''}${active ? ' active' : hasActive ? ' dimmed' : ''}${s.empty ? ' empty' : ''}${s.offline ? ' offline' : ''}`;
      const label = s.external ? `${s.number}-EXT` : s.number;
      const title = `${label} · ${s.material} · ${s.name} · ${s.remaining}${active ? a2pText(this?._hass, "inUse") : ''}`;
      const dryingMark = drying ? `<g class="drying-indicator" role="img" aria-label="${a2pText(this._hass,'dryingStatus')}"><title>${a2pText(this._hass,'dryingStatus')}</title><g transform="translate(${x+49} ${y+13})" fill="none" stroke="var(--a2p-warm)" stroke-width="2.5" stroke-linecap="round"><path d="M3 23C-2 18 8 13 3 8M11 23C6 18 16 13 11 3M19 23C14 18 24 13 19 8"/></g></g><path class="drying-frame" d="M${x-72} ${y+3}H${x+72}A12 12 0 0 1 ${x+84} ${y+15}V${y+180}A12 12 0 0 1 ${x+72} ${y+192}H${x-72}A12 12 0 0 1 ${x-84} ${y+180}V${y+15}A12 12 0 0 1 ${x-72} ${y+3}Z"/>` : '';
      const colors = s.colors.length ? s.colors : [s.color];
      const segments = colors.map((c, i) => `<circle cx="0" cy="0" r="34" fill="none" stroke="${esc(c)}" stroke-width="25" pathLength="100" stroke-dasharray="${s.amount / colors.length} ${100 - s.amount / colors.length}" stroke-dashoffset="${-i * s.amount / colors.length}" transform="rotate(-90)"/>`).join('');
      return `<g class="${cls}" data-slot="${s.number}" data-entity="${esc(s.entity)}" role="button" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>
        <rect class="slot-frame" x="${x - 87}" y="${y}" width="174" height="195" rx="15"/>${dryingMark}
        <rect class="slot-number" x="${x - 77}" y="${y + 10}" width="${s.external ? 82 : 29}" height="29" rx="14" fill="#343434"/>
        ${ams3hText(x - 63, y + 34, label, 25, s.external ? '' : 'text-anchor="middle"')}
        <g transform="translate(${x} ${y + 93})" class="spool">
          ${s.empty || s.offline ? `<circle r="51" fill="#1e1e1e" stroke="#555" stroke-width="2" stroke-dasharray="4 4"/>${ams3hText(0, 9, s.offline ? '—' : '/', 26, 'text-anchor="middle" fill="#888"')}` :
            `<circle r="51" fill="#282828" stroke="#686868" stroke-width="3"/>${segments}<circle r="46" fill="url(#spool-shade)"/><circle r="20" fill="#131313" stroke="#555" stroke-width="4"/><path d="M35 0h9" stroke="#888" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>`}
        </g>${(this._config.show_labels !== false && (!s.empty || this._config.show_empty_label)) ? ams3hText(x, y + 174, s.material.length > 13 ? s.material.slice(0, 12) + '…' : s.material, 25, 'text-anchor="middle"') : ''}</g>`;
    }
    _ams3hPath(s, active) {
      const x = 284 + (s.number - 1) * 104, y = s.number % 2 === 0 ? 275 : 487;
      return `<g class="feed${active ? ' active' : ''}" data-tool="${s.number}" style="--feed-color:${esc(s.color)}">
        <path class="tube" d="M${x} ${y}V545"/>
        <g class="tool" transform="translate(${x} 508)"><rect class="tool-frame" x="-21" width="42" height="64" rx="4"/>
          <path d="M-5-10H5V1h9v54H-14V1h9Z" fill="#383838"/>
          <path d="M-11 31H11v17H-11Z" fill="#686868"/><path d="M-10 34H10m-20 4H10m-20 4H10" stroke="#222"/>
          <path d="M-4 26H4V67L0 77-4 67Z" fill="#adadad"/>
          <path${active ? ' class="tool-filament"' : ''} d="M0 ${active ? -10 : 28}V73" stroke="${esc(s.empty || s.offline ? '#777' : s.color)}" stroke-width="3"/>
        </g></g>`;
    }

  /* ---------- 第三方盘余量：数据源换成 Spoolman ---------- */
  _spoolPct(color, slotNo) {
    const hass = this._hass;
    if (!hass || !hass.states) return null;
    const now = Date.now();
    if (!this._spmMap || !this._spmAt || now - this._spmAt > 1000) {
      const map = {}, hexp = {};
      for (const eid in hass.states) {
        if (eid.indexOf('sensor.spoolman_spool_') !== 0) continue;
        if (eid.slice(23).indexOf('_') >= 0) continue;
        const at = (hass.states[eid] && hass.states[eid].attributes) || {};
        const m = /_tray_(\d+)$/.exec(String(at.extra_active_tray || ''));
        if (!m) continue;
        const init = Number(at.initial_weight) || Number(at.filament_weight) || 0;
        const rem = Number(at.remaining_weight);
        if (!init || !isFinite(rem)) continue;
        const hex = String(at.filament_color_hex || '').replace('#','').slice(0,6).toUpperCase();
        const p = Math.max(0, Math.min(100, (rem / init) * 100));
        map[m[1] + '|' + hex] = p;
        if (hexp[hex] === undefined) hexp[hex] = p;
        else if (hexp[hex] !== p) hexp[hex] = -1;
      }
      this._spmMap = map; this._spmHex = hexp; this._spmAt = now;
    }
    const c = String(color || '').replace('#','').slice(0,6).toUpperCase();
    const a = this._spmMap[(slotNo != null ? slotNo : '') + '|' + c];
    if (a !== undefined) return a;
    const b = this._spmHex[c];
    return (b !== undefined && b >= 0) ? b : null;
  }

  /* ---------- 数据 ---------- */
  _slot(entityId) {
    if (!entityId) return { empty: true, type: a2pText(this?._hass, "empty"), color: '#000000', remain: -1, name: '', active: false };
    const st = this._hass && this._hass.states[entityId];
    if (!st) {
      return { empty: true, type: '?', color: '#000000', remain: -1, name: a2pText(this?._hass, "entityMissing"), missing: true, active: false };
    }
    const a = st.attributes || {};
    const cols = Array.isArray(a.cols) ? a.cols.filter((c) => !isBlankColor(c)) : [];
    const rawColor = cols[0] || a.color || '';
    const empty =
      a.unknown === true ||
      a.empty === true ||
      a.type === '?' ||
      isBlankColor(rawColor) ||
      st.state === 'Empty' ||
      st.state === 'empty';
    const remainNum = a.remain == null ? -1 : Number(a.remain);
    const label = empty ? '' : (a.type && a.type !== '?' ? String(a.type) : (a.name ? String(a.name) : ''));
    const remainVal = Number.isNaN(remainNum) ? -1 : remainNum;
    const spoolPct = (!empty && remainVal < 0) ? this._spoolPct(rawColor, a.slot) : null;
    return {
      empty,
      color: empty ? '#000000' : String(rawColor).slice(0, 7),
      remain: remainVal,
      spoolPct,
      type: label || '?',
      name: a.name || st.state || '',
      active: !!(a.active || a.in_use),
    };
  }

  _update() {
    if (!this._config || !this._hass) return;
    const r = this._resolve();
    this._variantKey = r.variantKey;
    if (r.variantKey === 'ams3h') { this._updateAms3h(r); return; }
    const slots = r.trays.map((id) => this._slot(id));
    const infoSig = `${r.tempEntity}:${r.tempEntity && this._hass.states[r.tempEntity] ? this._hass.states[r.tempEntity].state : ''}` +
      `|${r.humEntity}:${r.humEntity && this._hass.states[r.humEntity] ? this._hass.states[r.humEntity].state : ''}`;
    const sig = JSON.stringify([a2pLanguage(this._hass),r.variantKey, r.dir, r.trays, slots,
      this._config.show_labels, this._config.label_mode, this._config.show_empty_label,
      this._config.show_info_bar,
      this._config.spool_anim_glow, this._config.spool_anim_halo, this._config.spool_anim_reflection,
      this._config.title, infoSig, this._deviceWidth()]);
    if (sig === this._sig) return;
    this._sig = sig;
    this._render(r, slots);
    this._preload(r.dir);
  }

  _deviceWidth() {
    return this.clientWidth || 0;
  }

  _preload(dir) {
    if (!dir || dir === this._preloadedPath) return;
    ['base.png', 'mech.png', 'brand.png'].forEach((n) => {
      const im = new Image();
      im.src = `${dir}/${n}`;
    });
    this._preloadedPath = dir;
  }

  /* ---------- 绘制 ---------- */
  _gradientStops() {
    return FADE_STOPS.map(([off, v]) => {
      const g = Math.round(Math.max(0, Math.min(1, v)) * 255);
      const hex = g.toString(16).padStart(2, '0');
      return `<stop offset="${off.toFixed(5)}" stop-color="#${hex}${hex}${hex}"/>`;
    }).join('');
  }

  _spool(cx, s, geo) {
    const { spW, spH, spY, flangeFrac, bandCY, matCap } = geo;
    const x0 = cx - spW / 2;
    const x1 = cx + spW / 2;
    const y0 = spY;
    const y1 = spY + spH;
    const rim = Math.max(3, spW * flangeFrac);
    const dk = 1;
    const f = (v) => Number(v.toFixed(2));
    let o = '';
    o += `<rect x="${f(x0)}" y="${y0}" width="${dk}" height="${spH}" fill="#3a3a3a" fill-opacity="0.667"/>`;
    o += `<rect x="${f(x0 + dk)}" y="${y0}" width="${f(rim - dk)}" height="${spH}" fill="#d4d4d4"/>`;
    o += `<rect x="${f(x1 - dk)}" y="${y0}" width="${dk}" height="${spH}" fill="#3a3a3a" fill-opacity="0.667"/>`;
    o += `<rect x="${f(x1 - rim)}" y="${y0}" width="${f(rim - dk)}" height="${spH}" fill="#d4d4d4"/>`;

    const rx0 = x0 + rim;
    const rw = spW - 2 * rim;
    let bh = Math.max(1, Math.round((spH * Math.min(matCap, remainPct(s) / 100)) * 100) / 100);
    let by = bandCY - bh / 2;
    by = Math.max(y0 + 2, Math.min(by, y1 - bh - 2));

    /* 在用料盘视觉强调（v1.3 起，替代原「左右摆动」）：
       · rimGlow     —— 轮缘描边发光（跟随耗材颜色，静态可辨）
       · halo        —— 呼吸光晕：沿轮缘线一圈柔光做明暗脉动（scale 居中缩放）
       · lightReflection —— 高光斜向扫描（比 v1.2 更亮、更快、带倾角）
       ⚠️ v1.2 的 skew 摆动已按用户要求**移除**：摆动会在水平方向把材料带的
       可视包围盒撑大，越出白色轮缘（曾实测 8.09px）。v1.3 三项效果的主动效
       是 scale（居中缩放）与 translateY（纵向位移），**水平方向的几何范围不变**，
       从物理上就不可能左右越框。裁剪层仍然保留，作为兜底保险。
       ⚠️ 两层结构（沿用 v1.2 踩坑结论）：
       clip-path 与 transform 不能放在同一个元素上 —— 同元素上 clip 在「变换前的
       局部坐标」里生效，变换后的内容仍会露出。故外层 <g clip-path=…> 只裁、
       内层 <g class="…"> 只做变换。 */
    const animate = !s.empty && s.active === true;
    const doGlow = animate && this._config.spool_anim_glow !== false;
    const doHalo = animate && this._config.spool_anim_halo !== false;
    const doReflect = animate && this._config.spool_anim_reflection !== false;
    const clipId = animate ? `a2p-bclip-${s._clipSeq}` : null;
    if (clipId) {
      /* 裁剪窗口 = 轮缘中线以内的区域，高度按「料盘全高」给足，
         这样发光/光晕的纵向脉动不会被切掉，而横向永远钉死在轮缘内。 */
      const cx0 = x0 + rim / 2;
      const cw = spW - rim;
      this._clipDefs += `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">`
        + `<rect x="${f(cx0)}" y="${f(y0)}" width="${f(cw)}" height="${f(spH)}"/></clipPath>`;
    }

    o += clipId ? `<g clip-path="url(#${clipId})">` : '<g>';

    /* ① 呼吸光晕：贴轮缘内边界的一圈柔光，以盘心为原点 scale 缩放（1.000 ↔ 1.022）。
       v1.8 —— 「加高矩形 + 纵向渐隐遮罩」：
         矩形高度由 1.09 × 盘高 提到 **1.30 × 盘高**（上下各多出 15%），
         多出来的部分落在既有裁剪窗口（= 盘体矩形 y0 .. y0+spH）之外，被自然隐藏；
         同时可用的纵向行程变长，供入场下落使用。
         真正的「高度收窄 + 两端软化」由 defs 里的 <mask id="a2p-vfade-m"> 负责：
         遮罩在盘体 16% 以下 / 84% 以上全透明，40%~60% 全不透明，两段线性过渡
         → 光晕变成「中段浓、两端淡、到边归零」的柔和条带。
         （曾尝试只靠加高矩形达到同样效果：错。a2p-halo 是 objectBoundingBox 径向渐变，
           矩形拉高会把椭圆的纵向半径一起撑大，亮环被推到更外面，顶部反而更亮 ——
           实测顶部 10% 强度从 0.087 升到 0.293，方向相反。）
       入场拆分：外层 <g class="spool-halo-in"> 负责「从窗口上方滑入 + 整体淡入」，
       内层 <rect class="spool-halo"> 只负责 scale 脉动。
       两层分工后，入场与循环彻底解耦 —— 不再需要 v1.7 那种
       「渐入终值必须等于循环 0% 值」的相位握手，也不会互相争抢 opacity。 */
    if (doHalo) {
      const hx = x0 + rim / 2;
      const hw = spW - rim;
      const padY = spH * 0.15;     // 上下各多出 15% 盘高 → 总高 1.30 × spH
      this._vfade = true;
      /* 三层：① 纵向渐隐遮罩（固定不动，决定可见高度与两端软硬）
               ② 入场容器（只做 translateY 下落）
               ③ 光晕矩形（只做 scale 脉动）
         ⚠️ 遮罩与 transform 必须分层：同一元素上遮罩按「变换前的局部坐标」生效，
            下落时遮罩会跟着一起走，就变成「整条光带平移」而不是「渐显」。 */
      o += '<g class="spool-halo-mask" mask="url(#a2p-vfade-m)" style="pointer-events:none">'
        + '<g class="spool-halo-in">'
        + `<rect class="spool-halo" x="${f(hx)}" y="${f(y0 - padY)}" width="${f(hw)}"`
        + ` height="${f(spH + padY * 2)}" rx="${f(rim)}" fill="url(#a2p-halo)"`
        + ' style="transform-box:fill-box;transform-origin:center;pointer-events:none"/>'
        + '</g></g>';
    }

    /* ② 材料带本身（不再参与任何水平变换） */
    o += `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}" fill="${esc(s.color)}"/>`;
    o += `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}" fill="url(#a2p-hatch)"/>`;

    /* ③ 轮缘发光：给白色轮缘叠一层**耗材色淡染**（不是覆盖），
       保留原白色轮缘的质感与明暗，只让它明显偏向耗材色。
       横向范围严格等于原白色轮缘的 (x0+dk .. x1-dk)，
       **几何上与原轮缘完全重合**，不可能扩出去。
       opacity 只做轻微脉动（0.34 ↔ 0.62），与光晕同频。 */
    if (doGlow) {
      const gw = Math.max(1.2, rim - dk);
      this._vfade = true;
      o += '<g class="spool-rimglow-in" mask="url(#a2p-vfade-m)" style="pointer-events:none"><g class="spool-rimglow">'
        + `<rect x="${f(x0 + dk)}" y="${f(y0)}" width="${f(gw)}" height="${f(spH)}"`
        + ` fill="${esc(s.color)}" fill-opacity="0.5"/>`
        + `<rect x="${f(x1 - dk - gw)}" y="${f(y0)}" width="${f(gw)}" height="${f(spH)}"`
        + ` fill="${esc(s.color)}" fill-opacity="0.5"/>`
        + '</g></g>';
    }

    /* ④ 高光扫描 v1.14：纯垂直（90°）水平亮带，平滑往返扫过。
       ⚠️ 必须把高光裁到「材料带」的矩形内：高光 rect 与材料带同尺寸，位移后会
       露到带外的灰色区域 —— 实测半盘（30% 填充）时上下各溢出 54.7 / 96.7px。
       修法沿用既有约束（clip 与 transform 不能同元素）：
       外层 <g clip-path> 只负责裁到材料带矩形，内层 <g class="spool-reflection"> 只做位移。 */
    if (doReflect) {
      const bclipId = `a2p-binclip-${s._clipSeq}`;
      this._clipDefs += `<clipPath id="${bclipId}" clipPathUnits="userSpaceOnUse">`
        + `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}"/></clipPath>`;
      o += `<g clip-path="url(#${bclipId})">`
        + `<g class="spool-reflection" style="transform-box:fill-box;transform-origin:center;pointer-events:none">`
        + `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}" fill="url(#a2p-sheen)"/>`
        + '</g></g>';
    }

    o += '</g>';   // 外层（裁剪）

    const effPct = (!s.empty && s.remain > 0) ? s.remain : s.spoolPct;
    if (!s.empty && effPct != null && effPct > 0 && isFinite(effPct)) {
      const txt = `${Math.round(effPct)}%`;
      const bcx = rx0 + rw / 2;
      let bcy = by + bh / 2;
      if (geo.chipMaxY && bcy > geo.chipMaxY) bcy = geo.chipMaxY;
      const pw = chipWidth(txt, PCT_FONT, 20, 0.72);   // 加宽：+20 且不小于 0.72em/字符（100% 也框得住）
      const ph = PCT_FONT + 12;
      o += `<rect x="${f(bcx - pw / 2)}" y="${f(bcy - ph / 2)}" width="${f(pw)}" height="${f(ph)}" rx="5" fill="#000000" fill-opacity="0.549"/>`;
      o += `<text x="${f(bcx)}" y="${f(bcy)}" font-size="${PCT_FONT}" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(txt)}</text>`;
    }
    return o;
  }

  _labels(slots, geo) {
    const cfg = this._config;
    const fs = LABEL_FONT;
    const vx = geo.vb ? geo.vb[0] : 0;
    let o = '';
    slots.forEach((s, i) => {
      if (!geo.centers[i]) return;
      /* 空盘位：默认整块隐藏（不画黑框、不写「空」）；
         编辑器里把「空盘位标签」设为「显示」后恢复显示（show_empty_label = true） */
      if (s.empty && !cfg.show_empty_label) return;
      const txt = s.empty
        ? a2pText(this._hass, EMPTY_LABEL)
        : (cfg.label_mode === 'name' ? (s.name || s.type) : s.type);
      const cx = geo.centers[i] + vx;
      const pw = chipWidth(txt, fs, 26, 0.78);   // 与百分比同一口径，防止字体差异导致溢出
      const ph = fs + 16;
      const eid = (this._resolved && this._resolved.trays[i]) || '';
      o += `<g class="slotlabel" data-tray-entity="${esc(eid)}">`;
      o += `<rect x="${Number((cx - pw / 2).toFixed(2))}" y="${Number((geo.labelY - ph / 2).toFixed(2))}" width="${Number(pw.toFixed(2))}" height="${ph}" rx="6" fill="#000000" fill-opacity="0.45"/>`;
      o += `<text x="${cx}" y="${geo.labelY}" font-size="${fs}" font-weight="500" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(txt)}</text>`;
      o += '</g>';
    });
    return o;
  }

  /* AMS HT：LCD 实时温湿度（底图上烘焙的数字已擦除；第三格 Time 已按要求删掉） */
  _lcd(r) {
    const geo = VARIANTS.ht;
    const vx = geo.vb[0];
    const hass = this._hass;
    const val = (e) => (e && hass.states[e] && hass.states[e].state !== 'unavailable'
      && hass.states[e].state !== 'unknown' ? String(hass.states[e].state) : '');
    const unit = (e) => (e && hass.states[e] ? hass.states[e].attributes.unit_of_measurement || '' : '');
    const hum = val(r.humEntity);
    const temp = val(r.tempEntity);
    let o = '';
    geo.lcdFields.forEach((fd) => {
      let v = '--';
      if (fd.key === 'hum') v = hum !== '' ? `${hum}${unit(r.humEntity) === '%' ? '%' : ''}` : '--';
      else if (fd.key === 'temp') v = temp !== '' ? `${temp}°` : '--';
      o += `<text x="${fd.lx + vx}" y="${geo.lcdLabelY}" font-size="${geo.lcdLabelFont}" fill="#9a9a9a" text-anchor="middle">${a2pText(this._hass, fd.label)}</text>`;
      o += `<text x="${fd.x + vx}" y="${geo.lcdValueY}" font-size="${geo.lcdValueFont}" fill="#efefef" text-anchor="middle" font-weight="500">${esc(v)}</text>`;
    });
    return o;
  }

  /* 温湿度图标：内联 SVG（放大到 19px 并增加细节）
     温度 = 玻璃管 + 刻度 + 水银；湿度 = 水滴描边 + 内高光 */
  static ICON_TEMP = '<svg class="ic" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">'
    + '<path d="M10.9 14.4V6.5a1.15 1.15 0 0 1 2.3 0v7.9" fill="none" stroke="#e53935" stroke-width="1.5" stroke-linecap="round"/>'
    + '<circle cx="12.05" cy="17.2" r="2.7" fill="none" stroke="#e53935" stroke-width="1.5"/>'
    + '<circle cx="12.05" cy="17.2" r="1.3" fill="#e53935"/>'
    + '<path d="M12.05 10.4v5.2" stroke="#e53935" stroke-width="1.05" stroke-linecap="round"/>'
    + '<path d="M15.1 7.4h1.7M15.1 10h1.1M15.1 12.6h1.7" stroke="#e53935" stroke-width="1.1" stroke-linecap="round"/>'
    + '</svg>';
  static humidityIcon(state, attrs = '') {
    const solid = state !== '' && Number.isFinite(Number(state)) && Number(state) > 20;
    return '<svg class="ic humidity-icon" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" '+attrs+'>'
      + '<path d="M12 3.3c3.3 4.4 6.2 7.6 6.2 10.8a6.2 6.2 0 1 1-12.4 0C5.8 10.9 8.7 7.7 12 3.3Z" fill="'+(solid ? '#2196f3' : 'none')+'" stroke="#2196f3" stroke-width="1.5" stroke-linejoin="round"/>'
      + '</svg>';
  }

  _infoBar(r) {
    if (this._config.show_info_bar === false) return '';
    const hass = this._hass;
    const chip = (e, icon, fallbackUnit) => {
      if (!e || !hass.states[e]) return '';
      const st = hass.states[e];
      const u = (st.attributes && st.attributes.unit_of_measurement) || fallbackUnit;
      return `<span class="chip">${icon}<span class="val">${esc(st.state)}${esc(u)}</span></span>`;
    };
    const t = chip(r.tempEntity, Ams2ProCard.ICON_TEMP, '°C');
    const h = chip(r.humEntity, Ams2ProCard.humidityIcon(hass.states[r.humEntity]?.state), '%');
    if (!t && !h) return '';
    return `<div class="info">${t}${h}</div>`;
  }

  _render(r, slots) {
    const cfg = this._config;
    this._resolved = r;
    const geo = r.geo;
    let body = '';
    if (geo.unsupported) {
      body = `<div class="notice">${a2pText(this?._hass, "notSupportedPrefix")}${esc(geo.name)}${a2pText(this?._hass, "supportedSuffix")}</div>`;
    } else if (!slots.length) {
      // 未配置态：也是「添加卡片」选择器里的缩略图（路径同样走 assetDir，HACS 下才找得到）
      const thumbDir = cfg.asset_path
        ? cfg.asset_path.replace(/\/$/, '') : assetDir(VARIANTS.ams2pro);
      body = `<div class="thumb"><img src="${esc(thumbDir)}/card_thumb.png?v=${AMS2PRO_VERSION}"`
        + ` alt="${a2pText(this?._hass, "preview")}" loading="lazy"></div>`
        + `<div class="notice">${a2pText(this?._hass, "chooseDevice")}</div>`;
    } else {
      const [vbx, vby, vbw, vbh] = geo.vb || [0, 0, 700, 360];
      /* 注意：class="art" 必须写在这里。以前用 shadowRoot.querySelector('svg') 事后加类，
         那只抓到头部的温度图标 SVG → 主图从未参与 flex 布局（HT 图底部被裁掉 1/3） */
      let svg = `<svg class="art" viewBox="${vbx} ${vby} ${vbw} ${vbh}" preserveAspectRatio="xMidYMid meet" xmlns="${AMS2PRO_SVG}" aria-label="${esc(geo.name)}${a2pText(this?._hass, "spoolStatus")}">`;
      /* 先渲染料盘（顺带收集每个在用料盘的裁剪路径），再拼 <defs>，
         这样 clipPath 的 id 在引用前定义、且数量随在用盘位数自适应 */
      this._clipDefs = '';
      this._vfade = false;   // 有在用料盘时置真 → 输出「纵向渐隐遮罩」（收窄强调高度 + 两端软化）
      let spoolSeq = 0;
      let spools = '';
      slots.forEach((s, i) => {
        if (!s.empty && geo.centers[i] != null) {
          s._clipSeq = spoolSeq++;
          spools += this._spool(geo.centers[i] + vbx, s, geo);
        }
      });

      svg += '<defs>';
      svg += '<pattern id="a2p-hatch" width="4" height="4" patternUnits="userSpaceOnUse">'
        + '<rect width="2" height="4" fill="#000000" fill-opacity="0.502"/></pattern>';
      /* 在用料盘高光渐层（配合 .spool-reflection 的扫描动画）。
         objectBoundingBox 保证在任何盘位尺寸下都按「带高」自适应。
         v1.4：x1 = x2 = 0 → 渐变线严格垂直（90°），高光为一条水平亮带垂直扫过；
         不再有 v1.3 的横向偏移（那是被用户指出的「45° 斜向」来源）。 */
      svg += '<linearGradient id="a2p-sheen" x1="0" y1="0" x2="0" y2="1">'
        + '<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>'
        + '<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.62"/>'
        + '<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.78"/>'
        + '<stop offset="0.55" stop-color="#ffffff" stop-opacity="0.62"/>'
        + '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>'
        + '</linearGradient>';
      /* 呼吸光晕渐层：中心透明、边缘亮 → 叠加后呈现「沿轮缘一圈的柔光」 */
      svg += '<radialGradient id="a2p-halo" cx="0.5" cy="0.5" r="0.62">'
        + '<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>'
        + '<stop offset="0.62" stop-color="#ffffff" stop-opacity="0"/>'
        + '<stop offset="0.88" stop-color="#ffffff" stop-opacity="0.5"/>'
        + '<stop offset="1" stop-color="#ffffff" stop-opacity="0.08"/>'
        + '</radialGradient>';
      /* v1.8 纵向渐隐遮罩（光晕 / 轮缘发光共用一张）：
         把「在用料盘视觉强调」的可见高度收窄到盘体中部，并在两端平滑归零 ——
         ① 光晕不再一路铺满到盘体上/下沿（消除「顶部忽然冒出一大面高亮横带」）
         ② 轮缘发光由「整条轮缘均匀染色」变为「中段浓、两端淡」的柔和色带
         之所以用遮罩而不是继续改渐层尺寸：a2p-halo 是 objectBoundingBox 径向渐变，
         矩形一拉高，椭圆的纵向半径会同步被撑大，亮环反而被推到更外面 —— 实测顶部
         10% 的强度从 0.087 反升到 0.293，方向是相反的。
         这里用 userSpaceOnUse + maskUnits=userSpaceOnUse：遮罩按盘体矩形定位，
         与子元素自身的 translate / scale 无关，入场下落时遮罩不动、不产生拖影。 */
      if (this._vfade) {
        const n2 = (v) => Number(v.toFixed(2));
        const gy0 = geo.spY, gy1 = geo.spY + geo.spH;
        svg += `<linearGradient id="a2p-vfade" gradientUnits="userSpaceOnUse" x1="0" y1="${n2(gy0)}" x2="0" y2="${n2(gy1)}">`
          + '<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>'
          + '<stop offset="0.16" stop-color="#ffffff" stop-opacity="0"/>'
          + '<stop offset="0.40" stop-color="#ffffff" stop-opacity="1"/>'
          + '<stop offset="0.60" stop-color="#ffffff" stop-opacity="1"/>'
          + '<stop offset="0.84" stop-color="#ffffff" stop-opacity="0"/>'
          + '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>'
          + '</linearGradient>';
        svg += `<mask id="a2p-vfade-m" maskUnits="userSpaceOnUse" x="${n2(vbx)}" y="${n2(gy0 - geo.spH)}"`
          + ` width="${n2(vbw)}" height="${n2(geo.spH * 3)}">`
          + `<rect x="${n2(vbx)}" y="${n2(gy0 - geo.spH)}" width="${n2(vbw)}" height="${n2(geo.spH * 3)}"`
          + ' fill="url(#a2p-vfade)"/></mask>';
      }
      svg += this._clipDefs;   // 每个在用料盘一条：把摆动层裁到轮缘内边界，杜绝越框
      if (geo.fade === 'a2p') {
        svg += `<linearGradient id="a2p-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="360">`
          + this._gradientStops() + '</linearGradient>';
        svg += `<mask id="a2p-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="360">`
          + `<rect x="0" y="0" width="700" height="360" fill="url(#a2p-fade)"/></mask>`;
      }
      if (geo.clipY) {
        // 料盘下半段过了罩子/卡扣 → 全部遮挡不可见
        svg += `<clipPath id="a2p-clip" clipPathUnits="userSpaceOnUse">`
          + `<rect x="${vbx}" y="${vby}" width="${vbw}" height="${geo.clipY - vby}"/></clipPath>`;
      }
      svg += '</defs>';
      svg += `<image href="${esc(r.dir)}/base.png?v=${AMS2PRO_VERSION}" x="0" y="0" width="700" height="360" preserveAspectRatio="none"/>`;
      if (geo.fade === 'a2p') svg += '<g mask="url(#a2p-mask)">';
      else if (geo.clipY) svg += '<g clip-path="url(#a2p-clip)">';
      else svg += '<g>';
      svg += spools;   // 已在前面渲染并收集好裁剪路径
      svg += '</g>';
      if (geo.bandTop != null) {
        // 银色卡扣/罩子交界带：把底图的这一段重新画在料盘之上（完全不透明，恢复被料盘挡住的部分）
        svg += `<clipPath id="a2p-band" clipPathUnits="userSpaceOnUse">`
          + `<rect x="${vbx}" y="${geo.bandTop}" width="${vbw}" height="${geo.bandBot - geo.bandTop}"/></clipPath>`;
        svg += `<image href="${esc(r.dir)}/base.png?v=${AMS2PRO_VERSION}" x="0" y="0" width="700" height="360"`
          + ` preserveAspectRatio="none" clip-path="url(#a2p-band)" style="pointer-events:none"/>`;
      }
      if (geo.layers) {
        svg += `<image href="${esc(r.dir)}/mech.png?v=${AMS2PRO_VERSION}" x="0" y="0" width="700" height="360" preserveAspectRatio="none" style="pointer-events:none"/>`;
        svg += `<image href="${esc(r.dir)}/brand.png?v=${AMS2PRO_VERSION}" x="0" y="0" width="700" height="360" preserveAspectRatio="none" style="pointer-events:none"/>`;
      }
      if (cfg.show_labels !== false) svg += this._labels(slots, geo);
      if (geo.lcd) svg += this._lcd(r);
      svg += '</svg>';
      body = svg;
    }

    const showTitle = cfg.show_title !== false && !!cfg.title;
    const title = showTitle ? `<div class="title">${esc(cfg.title)}</div>` : '';
    const info = geo.unsupported || !slots.length ? '' : this._infoBar(r);
    const centerHead = r.variantKey === 'ht';   // HT 卡较窄，温湿度居中显示更好看
    const head = (title || info) ? `<div class="head${centerHead ? ' center' : ''}">${title}${info}</div>` : '';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
        ha-card { overflow: hidden; height: 100%; display: flex; flex-direction: column;
          background: var(--ha-card-background, var(--card-background-color, #fff)); color:var(--primary-text-color,#ddd); border-color:var(--ha-card-border-color,var(--divider-color,#555)); }
        .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px 0; }
        
        .head.center { justify-content: center; }
        .title { font-size: 15px; font-weight: 500; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .info { display: flex; gap: 12px; font-size: 14px; color: var(--secondary-text-color); flex: 0 0 auto; }
        .info .chip { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .info .ic { display: block; }
        
        .art { display: block; width: 100%; flex: 1 1 auto; min-height: 0; }
        .notice { padding: 10px 16px 14px; text-align: center; color: var(--secondary-text-color); font-size: 13px; }
        .thumb { padding: 10px 12px 0; }
        .thumb img { display: block; width: 100%; height: auto; border-radius: 10px; }
        text { font-family: ${FONT_STACK}; }
        .slotlabel { cursor: pointer; }
        .slotlabel:hover rect { fill-opacity: 0.72; }
        
        
        .spool-halo-in {
          opacity: 0;
          transform: translateY(-50%);
          transform-box: fill-box;
          animation: a2pHaloIn 2s ease-in-out both;
        }
        @keyframes a2pHaloIn {
          from { opacity: 0; transform: translateY(-50%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spool-halo {
          opacity: 0.40;
          transform: scale(1.011);
          animation: a2pHalo 3.08s linear infinite;
        }
        @keyframes a2pHalo {
          0%   { transform: scale(1.011); opacity: 0.40; animation-timing-function: ease-out; }
          25%  { transform: scale(1.022); opacity: 0.56; animation-timing-function: ease-in; }
          50%  { transform: scale(1.011); opacity: 0.40; animation-timing-function: ease-out; }
          75%  { transform: scale(1.000); opacity: 0.24; animation-timing-function: ease-in; }
          100% { transform: scale(1.011); opacity: 0.40; }
        }
        
        .spool-rimglow-in {
          opacity: 0;
          animation: a2pRimIn 2s ease-in-out both;
        }
        @keyframes a2pRimIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .spool-rimglow {
          opacity: 0.45;
          animation: a2pRim 3.08s linear infinite;
        }
        @keyframes a2pRim {
          0%   { opacity: 0.45; animation-timing-function: ease-out; }
          25%  { opacity: 0.56; animation-timing-function: ease-in; }
          50%  { opacity: 0.45; animation-timing-function: ease-out; }
          75%  { opacity: 0.34; animation-timing-function: ease-in; }
          100% { opacity: 0.45; }
        }
        
        .spool-reflection {
          transform: translateY(0%);
          opacity: 1;
          animation: a2pSheen 3.2s linear infinite;
        }
        @keyframes a2pSheen {
          0%   { transform: translateY(0%); opacity: 1; animation-timing-function: ease-out; }
          25%  { transform: translateY(50%); opacity: 1; animation-timing-function: ease-in; }
          50%  { transform: translateY(0%); opacity: 1; animation-timing-function: ease-out; }
          75%  { transform: translateY(-50%); opacity: 1; animation-timing-function: ease-in; }
          100% { transform: translateY(0%); opacity: 1; }
        }
        
        @media (prefers-reduced-motion: reduce) {
          
          .spool-halo-in { animation: none; opacity: 1; transform: none; }
          .spool-halo { animation: none; }
          .spool-rimglow-in { animation: none; opacity: 1; }
          .spool-rimglow { animation: none; opacity: 0.45; }
          .spool-reflection { animation: none; }
        }
      </style>
      <ha-card>${head}${body}</ha-card>`;
    this._bindLabelClicks(r);
  }

  /* 点击耗材标签 → 打开原集成的耗材资料弹窗（ams-popup）；不可用时退回 more-info */
  _bindLabelClicks(r) {
    const root = this.shadowRoot;
    if (!root) return;
    root.querySelectorAll('[data-tray-entity]').forEach((g) => {
      g.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._openFilamentPopup(g.getAttribute('data-tray-entity'));
      });
    });
  }

  _openFilamentPopup(entityId) {
    if (!entityId) return;
    if (customElements.get('ams-popup')) {
      let p = this._popupEl;
      if (!p || !p.isConnected) {
        p = document.createElement('ams-popup');
        p.style.cssText = 'position:fixed;left:-200vw;top:0;width:1px;height:1px';
        document.body.appendChild(p);
        this._popupEl = p;
      }
      p.hass = this._hass;
      p.entity_id = entityId;
      if (p.is_bambu_lab === undefined) p.is_bambu_lab = true;
      const inner = p.shadowRoot && p.shadowRoot.querySelector('.popup-action-container');
      if (inner) {
        inner.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      } else {
        p.click();
      }
      return;
    }
    // 集成卡片未加载时的退回方案：HA 原生 more-info
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }
}

/* ============================ 编辑器 ============================ */
class Ams2ProCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = Object.assign({}, config);
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    a2pRegister(hass);
    if (this._config) this._render();
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: Object.assign({}, this._config) },
      bubbles: true,
      composed: true,
    }));
  }

  _amsDevices() {
    if (!this._hass || !this._hass.devices) return [];
    return Object.values(this._hass.devices)
      .filter((d) => (d.manufacturer || '').toLowerCase().includes('bambu')
        && /ams/i.test(amsDeviceModel(d, this._hass)))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  /* 设备自身的温/湿度实体（自动模式用） */
  _deviceSensorEntities(deviceId, kind) {
    if (!deviceId || !this._hass || !this._hass.entities) return [];
    const out = [];
    for (const [eid, ent] of Object.entries(this._hass.entities)) {
      if (ent.device_id !== deviceId || ent.disabled_by) continue;
      const st = this._hass.states[eid];
      const dc = (st && st.attributes && st.attributes.device_class) || '';
      const isTemp = dc === 'temperature' || /_temperature$/.test(eid);
      const isHum = dc === 'humidity' || (/_humidity$/.test(eid) && !/_index$/.test(eid));
      if (kind === 'temp' ? isTemp : isHum) out.push(eid);
    }
    return out.sort();
  }

  /* 全 HA 的温/湿度实体（手动模式用），带友好名，可按关键字筛选 */
  _haSensorEntities(kind, filterText) {
    if (!this._hass || !this._hass.states) return [];
    const kw = String(filterText || '').trim().toLowerCase();
    const want = kind === 'temp' ? 'temperature' : 'humidity';
    const out = [];
    for (const [eid, st] of Object.entries(this._hass.states)) {
      const a = st.attributes || {};
      const dc = a.device_class || '';
      const byDc = dc === want;
      const byName = kind === 'temp' ? /_temperature$/.test(eid)
        : (/_humidity$/.test(eid) && !/_index$/.test(eid));
      if (!byDc && !byName) continue;
      const name = a.friendly_name || eid;
      if (kw && !(`${name} ${eid}`.toLowerCase().includes(kw))) continue;
      out.push({ eid, name });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  /* 统一元素查找：自动补 '#'。
     血泪教训：漏写 '#' 时 querySelector('ams') 会当标签选择器 → null →
     下一行 el.innerHTML 抛 Cannot set properties of null (setting 'innerHTML')，
     HA 直接弹「不支持可视化编辑器」。所有取元素的地方一律走这个函数。 */
  _q(id) {
    if (!id) return null;
    return this.querySelector(id.charAt(0) === '#' ? id : '#' + id);
  }

  _render() {
    try {
      const language = a2pLanguage(this._hass);
      if (this._language !== language) { this.innerHTML = ''; this._rendered = false; this._language = language; }
      if (this._rendered) this._refreshValues();
      else this._build();
    } catch (e) {
      const box = this._q('ederr');
      const msg = a2pText(this?._hass, "editorError") + ((e && e.message) || e);
      if (box) box.textContent = msg;
      console.error('[ams2pro-card-editor]', e);
    }
  }

  _build() {
    if (this._q('ams')) {                 // 已构建过：只刷新值，避免清空重来
      this._rendered = true;
      this._fillSensors();
      this._refreshValues();
      return;
    }
    const row = (labelText, inputHtml) =>
      `<div class="row"><label>${labelText}</label>${inputHtml}</div>`;
    const sensorBlock = (p, title) => `
      ${row(title, `<select id="${p}mod">
          <option value="auto">${a2pText(this?._hass, "autoDevice")}</option>
          <option value="manual">${a2pText(this?._hass, "manual")}</option>
        </select>`)}
      <div id="${p}manual" class="manual" style="display:none">
        ${row('', `<input id="${p}filter" type="text" placeholder="${a2pText(this?._hass, "filter")}">`)}
        ${row('', `<select id="${p}ent"></select>`)}
      </div>`;
    this.innerHTML = `
      <style>
        :host { display: block; }
        .row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .row label { flex: 0 0 110px; font-size: 13px; color: var(--primary-text-color); }
        select, input[type=text] {
          flex: 1; width: 100%; box-sizing: border-box;
          padding: 8px 10px; font-size: 13px;
          border: 1px solid var(--divider-color, #ccc); border-radius: 6px;
          background: var(--card-background-color, #fff); color: var(--primary-text-color);
        }
        .manual { margin-left: 120px; }
        .hint { font-size: 12px; color: var(--secondary-text-color); margin: 2px 0 10px 120px; }
        .err { color: var(--error-color, #c62828); font-size: 12px; white-space: pre-wrap; }
      </style>
      ${row(a2pText(this?._hass, "device"), `<select id="ams"></select>`)}
      <div class="hint">${a2pText(this?._hass, "deviceHint")}</div>
      <div id="ams3hfields"></div>
      ${sensorBlock('t', a2pText(this?._hass, "tempSensor"))}
      ${sensorBlock('h', a2pText(this?._hass, "humSensor"))}
      <div class="hint">${a2pText(this?._hass, "sensorHint")}</div>
      ${row(a2pText(this?._hass, "showName"), `<select id="showtitle">
          <option value="true">${a2pText(this?._hass, "show")}</option>
          <option value="false">${a2pText(this?._hass, "hide")}</option>
        </select>`)}
      <div id="titlerow" class="row" style="display:none">
        <label>${a2pText(this?._hass, "title")}</label>
        <input id="title" type="text" placeholder="${a2pText(this?._hass, "nameHint")}">
      </div>
      ${row(a2pText(this?._hass, "infoBar"), `<select id="infobar">
          <option value="true">${a2pText(this?._hass, "show")}</option>
          <option value="false">${a2pText(this?._hass, "hide")}</option>
        </select>`)}
      ${row(a2pText(this?._hass, "emptyLabel"), `<select id="emptylabel">
          <option value="false">${a2pText(this?._hass, "hideDefault")}</option>
          <option value="true">${a2pText(this?._hass, "showEmpty")}</option>
        </select>`)}
      <div class="hint">${a2pText(this?._hass, "emptyHint")}</div>
      ${row(a2pText(this?._hass, "halo"), `<select id="animhalo">
          <option value="true">${a2pText(this?._hass, "onDefault")}</option>
          <option value="false">${a2pText(this?._hass, "off")}</option>
        </select>`)}
      <div class="hint">${a2pText(this?._hass, "haloHint")}</div>
      ${row(a2pText(this?._hass, "rim"), `<select id="animglow">
          <option value="true">${a2pText(this?._hass, "onDefault")}</option>
          <option value="false">${a2pText(this?._hass, "off")}</option>
        </select>`)}
      <div class="hint">${a2pText(this?._hass, "rimHint")}</div>
      ${row(a2pText(this?._hass, "sheen"), `<select id="animrefl">
          <option value="true">${a2pText(this?._hass, "onDefault")}</option>
          <option value="false">${a2pText(this?._hass, "off")}</option>
        </select>`)}
      <div class="hint">${a2pText(this?._hass, "sheenHint")}</div>
      <div id="ederr" class="err"></div>
    `;
    const sel = this._q('ams');
    if (sel) {
      sel.innerHTML = ("<option value=\"\">" + a2pText(this?._hass, "unselected") + "</option>") + this._amsDevices()
        .map((d) => {
          const tail = variantFromModel(amsDeviceModel(d, this._hass)) === 'lite' ? a2pText(this?._hass, "unsupported") : '';
          return `<option value="${esc(d.id)}">${esc(d.name_by_user || d.name || d.id)}（${esc(variantFromModel(amsDeviceModel(d, this._hass)) === 'ams3h' ? 'AMS-3H' : d.model || '')}${tail}）</option>`;
        })
        .join('');
      sel.addEventListener('change', () => {
        this._config.ams_device = sel.value;
        // 切换设备后回到「自动」，重新按设备匹配
        this._config.temperature_entity = '';
        this._config.humidity_entity = '';
        this._fillSensors();
        this._refreshValues();
        this._emit();
      });
    }
    // 温度/湿度：模式切换 + 筛选 + 实体选择
    [['t', 'temperature_entity'], ['h', 'humidity_entity']].forEach(([p, key]) => {
      const mod = this._q(`${p}mod`);
      const flt = this._q(`${p}filter`);
      const ent = this._q(`${p}ent`);
      if (mod) {
        mod.addEventListener('change', () => {
          if (mod.value === 'auto') this._config[key] = '';   // 回到自动
          this._fillSensors();
          this._refreshValues();
          this._emit();
        });
      }
      if (flt) {
        flt.addEventListener('input', () => {
          this._fillSensors();
          this._refreshValues();
        });
      }
      if (ent) {
        ent.addEventListener('change', () => {
          this._config[key] = ent.value;
          this._emit();
        });
      }
    });
    const ib = this._q('infobar');
    if (ib) {
      ib.addEventListener('change', () => {
        this._config.show_info_bar = this._q('infobar').value === 'true';
        this._emit();
      });
    }
    const elb = this._q('emptylabel');
    if (elb) {
      elb.addEventListener('change', () => {
        this._config.show_empty_label = elb.value === 'true';
        this._emit();
      });
    }
    const ah2 = this._q('animhalo');
    if (ah2) {
      ah2.addEventListener('change', () => {
        this._config.spool_anim_halo = ah2.value === 'true';
        this._emit();
      });
    }
    const ag = this._q('animglow');
    if (ag) {
      ag.addEventListener('change', () => {
        this._config.spool_anim_glow = ag.value === 'true';
        this._emit();
      });
    }
    const ar = this._q('animrefl');
    if (ar) {
      ar.addEventListener('change', () => {
        this._config.spool_anim_reflection = ar.value === 'true';
        this._emit();
      });
    }
    const ti = this._q('title');
    if (ti) {
      ti.addEventListener('input', () => {
        this._config.title = ti.value;
        this._emit();
      });
    }
    const st = this._q('showtitle');
    if (st) {
      st.addEventListener('change', () => {
        this._config.show_title = st.value === 'true';
        this._syncTitleRow();          // 开关打开才显示「卡片名称」输入栏
        this._emit();
      });
    }
    this._fillSensors();
    this._refreshValues();
    this._rendered = true;
  }

  /* 手动模式：填完整 HA 的温/湿度实体（带筛选）；自动模式：不显示手动块 */
  _fillSensors() {
    const cfg = this._config || {};
    [['t', 'temp', 'temperature_entity'], ['h', 'hum', 'humidity_entity']].forEach(([p, kind, key]) => {
      const mod = this._q(`${p}mod`);
      const block = this._q(`${p}manual`);
      const ent = this._q(`${p}ent`);
      const filterText = (this._q(`${p}filter`) || {}).value || '';
      const cur = cfg[key] || '';
      const manual = !!cur || (mod && mod.value === 'manual');
      if (block) block.style.display = manual ? '' : 'none';
      if (mod) mod.value = manual ? 'manual' : 'auto';
      if (!ent) return;
      const list = manual ? this._haSensorEntities(kind, filterText) : [];
      ent.innerHTML = ("<option value=\"\">" + a2pText(this?._hass, "auto") + "</option>") + list
        .map((e) => `<option value="${esc(e.eid)}">${esc(e.name)} · ${esc(e.eid)}</option>`)
        .join('');
      ent.value = list.some((e) => e.eid === cur) ? cur : '';
      if (manual && cur && !list.some((e) => e.eid === cur)) {
        // 当前值不在筛选结果里：补一条，避免选择被清掉
        ent.innerHTML += `<option value="${esc(cur)}">${esc(cur)}${a2pText(this?._hass, "current")}</option>`;
        ent.value = cur;
      }
    });
  }

  /* 「名称显示」开关打开时才出现「卡片名称」输入栏 */
  _syncTitleRow() {
    const cfg = this._config || {};
    const row = this._q('titlerow');
    if (row) row.style.display = cfg.show_title === false ? 'none' : '';
  }

  _refreshValues() {
    const cfg = this._config || {};
    const sel = this._q('ams');
    if (sel) sel.value = cfg.ams_device || '';
    const ib = this._q('infobar');
    if (ib) ib.value = cfg.show_info_bar === false ? 'false' : 'true';
    const elb = this._q('emptylabel');
    if (elb) elb.value = cfg.show_empty_label === true ? 'true' : 'false';
    const ah2 = this._q('animhalo');
    if (ah2) ah2.value = cfg.spool_anim_halo === false ? 'false' : 'true';
    const ag = this._q('animglow');
    if (ag) ag.value = cfg.spool_anim_glow === false ? 'false' : 'true';
    const ar = this._q('animrefl');
    if (ar) ar.value = cfg.spool_anim_reflection === false ? 'false' : 'true';
    const ti = this._q('title');
    if (ti && ti.value !== (cfg.title || '')) ti.value = cfg.title || '';
    const st = this._q('showtitle');
    if (st) st.value = cfg.show_title === false ? 'false' : 'true';
    this._syncTitleRow();
    this._refreshAms3hFields();
  }

  _refreshAms3hFields() {
    const box=this._q('ams3hfields'); if(!box)return;
    const cfg=this._config,dev=this._hass?.devices?.[cfg.ams_device];
    const enabled=variantFromModel(amsDeviceModel(dev,this._hass))==='ams3h';
    box.hidden=!enabled;
    if(!enabled)return;
    const fields=[['active_tray_entity',a2pText(this?._hass, "activeTray")],...[1,2].flatMap(z=>['temperature','humidity','remaining_drying_time'].map(k=>['zone_'+z+'_'+k+'_entity',(z===1 ? a2pText(this?._hass, "rightZone") : a2pText(this?._hass, "leftChamber"))+' '+({temperature:a2pText(this?._hass, "temperature"),humidity:a2pText(this?._hass, "humidity"),remaining_drying_time:a2pText(this?._hass, "timeLeft")})[k]])),...Array.from({length:9},(_,i)=>['ams3h_tray_'+i,a2pText(this?._hass, "slot")+(i+1)])];
    const ids=Object.keys(this._hass.states || {}).filter(id=>id.startsWith('sensor.')).sort();
    const sig=JSON.stringify([ids,fields.map(([k])=>k.startsWith('ams3h_tray_')?cfg.ams3h_trays?.[Number(k.slice(11))]:cfg[k])]);
    if(box.dataset.signature===sig)return;
    box.dataset.signature=sig;
    box.innerHTML=("<div class=\"hint\">" + a2pText(this?._hass, "fieldsHint") + "</div>")+fields.map(([key,label])=>{
      const current=key.startsWith('ams3h_tray_') ? cfg.ams3h_trays?.[Number(key.slice(11))] || '' : cfg[key] || '';
      const options=[...new Set([...ids,...(current?[current]:[])])];
      return '<div class="row"><label>'+esc(label)+'</label><select data-ams3h-key="'+key+("\"><option value=\"\">" + a2pText(this?._hass, "autoOwned") + "</option>")+options.map(id=>'<option value="'+esc(id)+'"'+(id===current?' selected':'')+'>'+esc(id)+'</option>').join('')+'</select></div>';
    }).join('');
    box.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{
      const key=el.dataset.ams3hKey;
      if(key.startsWith('ams3h_tray_')) {const a=[...(this._config.ams3h_trays || Array(9).fill(''))];a[Number(key.slice(11))]=el.value;this._config.ams3h_trays=a;}
      else this._config[key]=el.value;
      this._emit();
    }));
  }

}

if (!customElements.get('ams2pro-card')) {
  customElements.define('ams2pro-card', Ams2ProCard);
}
if (!customElements.get('ams2pro-card-editor')) {
  customElements.define('ams2pro-card-editor', Ams2ProCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'ams2pro-card')) {
  window.customCards.push({
    type: 'ams2pro-card',
    name: a2pText(this?._hass, "cardName"),
    description: a2pText(this?._hass, "description"),
    preview: true,
    documentationURL: 'https://github.com/',
  });
}

console.info(
  `%c AMS2PRO-CARD %c v${AMS2PRO_VERSION} `,
  'color:#fff;background:#0F6E56;font-weight:500;border-radius:4px 0 0 4px;padding:2px 6px',
  'color:#0F6E56;background:#E1F5EE;font-weight:500;border-radius:0 4px 4px 0;padding:2px 6px'
);
