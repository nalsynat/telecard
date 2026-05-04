import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #002D62; font-family: -apple-system, Inter, Arial, sans-serif; min-height: 100vh; }
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 32px; text-align: center; }
        .logo { font-size: 48px; font-weight: 800; color: white; letter-spacing: 2px; margin-bottom: 8px; }
        .tagline { font-size: 16px; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 64px; }
        .feature { margin-bottom: 48px; }
        .feature-title { font-size: 22px; font-weight: 700; color: white; margin-bottom: 8px; }
        .feature-desc { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 300px; margin: 0 auto; }
        .cta { margin-top: 16px; }
        .cta-btn { display: inline-block; background: white; color: #002D62; font-size: 16px; font-weight: 700; padding: 18px 40px; border-radius: 14px; text-decoration: none; letter-spacing: 0.5px; }
        .cta-sub { margin-top: 16px; font-size: 13px; color: rgba(255,255,255,0.3); }
        .divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); margin: 32px auto; }
        .brand { margin-top: 64px; font-size: 11px; color: rgba(255,255,255,0.15); letter-spacing: 2px; }
      ` }} />
      <div className="hero">
        <div className="logo">TeleCard</div>
        <div className="tagline">Your digital identity</div>

        <div className="feature">
          <div className="feature-title">Lock screen. QR code. Done.</div>
          <div className="feature-desc">Set your Smart Wallpaper as your lock screen. Anyone who scans it opens your profile instantly.</div>
        </div>

        <div className="divider" />

        <div className="feature">
          <div className="feature-title">No app download needed.</div>
          <div className="feature-desc">Built inside Telegram. Works on any phone. Save contacts with one tap.</div>
        </div>

        <div className="divider" />

        <div className="feature">
          <div className="feature-title">Know who scanned your card.</div>
          <div className="feature-desc">Mali notifies you every time someone views your TeleCard.</div>
        </div>

        <div className="cta">
          <a className="cta-btn" href="https://t.me/TeleNameCardBot">Get your TeleCard</a>
          <div className="cta-sub">Free. Takes 60 seconds.</div>
        </div>

        <div className="brand">TELECARD · CAMBODIA</div>
      </div>
    </>
  )
}