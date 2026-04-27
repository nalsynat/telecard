module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/app/api/wallpaper/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__ = __turbopack_context__.i("[externals]/sharp [external] (sharp, cjs, [project]/node_modules/sharp)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/qrcode/lib/index.js [app-route] (ecmascript)");
;
;
;
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 2340;
const PRUSSIAN_BLUE = {
    r: 0,
    g: 45,
    b: 98
};
const OXBLOOD = '#7B001C';
async function generateQRBuffer(url) {
    const qrDataUrl = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].toDataURL(url, {
        errorCorrectionLevel: 'H',
        width: 280,
        margin: 4,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
    const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64, 'base64');
}
function buildHeaderSVG() {
    const svg = `<svg width="${CANVAS_WIDTH}" height="351" xmlns="http://www.w3.org/2000/svg"><rect width="${CANVAS_WIDTH}" height="351" fill="#002D62"/><text x="540" y="175" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">TeleCard</text></svg>`;
    return Buffer.from(svg);
}
function buildActionZoneSVG(fullName, jobTitle, username) {
    const safeName = fullName.replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '');
    const safeTitle = jobTitle.replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '');
    const safeUsername = username.replace(/&/g, '').replace(/</g, '').replace(/>/g, '');
    const svg = `<svg width="${CANVAS_WIDTH}" height="585" xmlns="http://www.w3.org/2000/svg"><rect width="${CANVAS_WIDTH}" height="585" fill="#002D62"/><text x="540" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">${safeName}</text><text x="540" y="155" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="${OXBLOOD}" text-anchor="middle" dominant-baseline="middle">${safeTitle}</text><rect x="400" y="195" width="280" height="280" fill="white" rx="8"/><text x="540" y="510" font-family="Arial, sans-serif" font-size="18" font-weight="400" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">telenamecard.vercel.app/${safeUsername}</text></svg>`;
    return Buffer.from(svg);
}
function buildGradientOverlaySVG() {
    const svg = `<svg width="${CANVAS_WIDTH}" height="468" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#002D62" stop-opacity="0"/><stop offset="100%" stop-color="#002D62" stop-opacity="0.8"/></linearGradient></defs><rect width="${CANVAS_WIDTH}" height="468" fill="url(#fadeDown)"/></svg>`;
    return Buffer.from(svg);
}
async function POST(req) {
    try {
        const formData = await req.formData();
        const photoFile = formData.get('photo');
        const fullName = formData.get('fullName') || 'Your Name';
        const jobTitle = formData.get('jobTitle') || 'Your Title';
        const username = formData.get('username') || 'username';
        if (!photoFile) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Photo is required'
            }, {
                status: 400
            });
        }
        const arrayBuffer = await photoFile.arrayBuffer();
        const photoBuffer = Buffer.from(new Uint8Array(arrayBuffer));
        const profileUrl = `https://telenamecard.vercel.app/${username}`;
        const resizedPhoto = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])(photoBuffer).rotate().flatten({
            background: {
                r: 0,
                g: 45,
                b: 98
            }
        }).resize(CANVAS_WIDTH, 1404, {
            fit: 'cover',
            position: 'centre'
        }).jpeg().toBuffer();
        const qrBuffer = await generateQRBuffer(profileUrl);
        const headerSVG = buildHeaderSVG();
        const actionSVG = buildActionZoneSVG(fullName, jobTitle, username);
        const gradientSVG = buildGradientOverlaySVG();
        const wallpaper = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])({
            create: {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                channels: 3,
                background: PRUSSIAN_BLUE
            }
        }).composite([
            {
                input: resizedPhoto,
                top: 351,
                left: 0
            },
            {
                input: await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])(Buffer.from(gradientSVG)).png().toBuffer(),
                top: 887,
                left: 0
            },
            {
                input: await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])(Buffer.from(headerSVG)).png().toBuffer(),
                top: 0,
                left: 0
            },
            {
                input: await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])(Buffer.from(actionSVG)).png().toBuffer(),
                top: 1755,
                left: 0
            },
            {
                input: await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sharp$29$__["default"])(qrBuffer).resize(280, 280).toBuffer(),
                top: 1950,
                left: 400
            }
        ]).jpeg({
            quality: 95
        }).toBuffer();
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](wallpaper, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'attachment; filename="telecard-wallpaper.jpg"'
            }
        });
    } catch (error) {
        console.error('Wallpaper generation error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to generate wallpaper',
            detail: error?.message || String(error)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0tc2ko_._.js.map