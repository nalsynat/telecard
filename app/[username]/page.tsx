import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = params

  // Fetch user and profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*, profiles(*)')
    .eq('username', username)
    .single()

  if (!user) return notFound()

  const profile = user.profiles?.[0]
  const profileUrl = `https://telenamecard.vercel.app/${username}`
  const botUrl = `https://t.me/TeleNameCardBot?start=scan_${user.id}`

  // Build vCard for download
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.full_name}`,
    profile?.job_title ? `TITLE:${profile.job_title}` : '',
    user.phone ? `TEL:${user.phone}` : '',
    `URL:${profileUrl}`,
    `NOTE:TeleCard @${username}`,
    'END:VCARD',
  ].filter(Boolean).join('\n')

  const vcardBase64 = Buffer.from(vcard).toString('base64')

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#002D62" />
        <title>{user.full_name} — TeleCard</title>
        <meta name="description" content={`${user.full_name}${profile?.job_title ? ` · ${profile.job_title}` : ''} on TeleCard`} />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #002D62;
            font-family: -apple-system, 'Inter', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .card {
            width: 100%;
            max-width: 390px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: #002D62;
          }
          .photo-zone {
            width: 100%;
            aspect-ratio: 1/1;
            position: relative;
            overflow: hidden;
            background: #001a3a;
          }
          .photo-zone img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center top;
          }
          .photo-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60%;
            background: linear-gradient(to bottom, transparent, #002D62);
          }
          .action-zone {
            flex: 1;
            padding: 24px 32px 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .name {
            font-size: 28px;
            font-weight: 700;
            color: white;
            text-align: center;
            letter-spacing: 0.3px;
          }
          .title {
            font-size: 12px;
            font-weight: 400;
            color: #7B001C;
            text-align: center;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .save-btn {
            width: 100%;
            padding: 16px;
            background: white;
            color: #002D62;
            font-size: 16px;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            display: block;
            margin-top: 16px;
            letter-spacing: 0.3px;
          }
          .telecard-btn {
            width: 100%;
            padding: 14px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            display: block;
            margin-top: 8px;
          }
          .divider {
            width: 40px;
            height: 1px;
            background: rgba(255,255,255,0.1);
            margin: 16px auto;
          }
          .social-links {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 8px;
          }
          .social-link {
            color: rgba(255,255,255,0.5);
            font-size: 13px;
            text-decoration: none;
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .brand {
            margin-top: auto;
            padding-top: 32px;
            font-size: 11px;
            color: rgba(255,255,255,0.2);
            text-align: center;
            letter-spacing: 1px;
          }
          .no-photo {
            width: 100%;
            aspect-ratio: 1/1;
            background: linear-gradient(135deg, #001a3a, #002D62);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .no-photo-initial {
            font-size: 80px;
            font-weight: 700;
            color: rgba(255,255,255,0.15);
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          {/* Photo zone */}
          <div className="photo-zone">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={user.full_name} />
            ) : (
              <div className="no-photo">
                <span className="no-photo-initial">
                  {user.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="photo-gradient" />
          </div>

          {/* Action zone */}
          <div className="action-zone">
            <div className="name">{user.full_name}</div>
            {profile?.job_title && (
              <div className="title">{profile.job_title}</div>
            )}

            {/* Primary CTA — Save Contact */}
            <a className="save-btn" href={'data:text/vcard;base64,' + vcardBase64} download={username + '.vcf'}>Save Contact</a>

            {/* Secondary CTA — Get your TeleCard */}
            <a className="telecard-btn" href={botUrl}>Get your own TeleCard</a>

            {/* Social links if available */}
            {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
              <>
                <div className="divider" />
                <div className="social-links">
                  {profile.social_links.linkedin && (
                    <a className="social-link" href={profile.social_links.linkedin} target="_blank">LinkedIn</a>
                  )}
                  {profile.social_links.facebook && (
                    <a className="social-link" href={profile.social_links.facebook} target="_blank">Facebook</a>
                  )}
                  {profile.social_links.telegram && (
                    <a className="social-link" href={profile.social_links.telegram} target="_blank">Telegram</a>
                  )}
                  {profile.social_links.website && (
                    <a className="social-link" href={profile.social_links.website} target="_blank">Website</a>
                  )}
                </div>
              </>
            )}

            <div className="brand">TELECARD</div>
          </div>
        </div>
      </body>
    </html>
  )
}