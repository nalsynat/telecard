import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!user) return notFound()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const profileUrl = 'https://telenamecard.vercel.app/' + username
  const botUrl = 'https://t.me/TeleNameCardBot?start=scan_' + user.id

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + user.full_name,
    profile?.job_title ? 'TITLE:' + profile.job_title : '',
    user.phone ? 'TEL:' + user.phone : '',
    'URL:' + profileUrl,
    'NOTE:TeleCard @' + username,
    'END:VCARD',
  ].filter(Boolean).join('\n')

  const vcardBase64 = Buffer.from(vcard).toString('base64')

  const styles = `
    body { background: #002D62 !important; font-family: -apple-system, Inter, Arial, sans-serif; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .card { width: 100%; max-width: 390px; min-height: 100vh; display: flex; flex-direction: column; background: #002D62; margin: 0 auto; }
    .photo-zone { width: 100%; aspect-ratio: 1/1; position: relative; overflow: hidden; background: #001a3a; }
    .photo-zone img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
    .photo-gradient { position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to bottom, transparent, #002D62); }
    .action-zone { flex: 1; padding: 24px 32px 48px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .name { font-size: 28px; font-weight: 700; color: white; text-align: center; letter-spacing: 0.3px; }
    .title { font-size: 12px; color: #7B001C; text-align: center; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px; }
    .save-btn { width: 100%; padding: 16px; background: white; color: #002D62; font-size: 16px; font-weight: 700; border: none; border-radius: 12px; text-decoration: none; text-align: center; display: block; margin-top: 16px; }
    .telecard-btn { width: 100%; padding: 14px; background: transparent; color: white; font-size: 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; text-decoration: none; text-align: center; display: block; margin-top: 8px; }
    .no-photo { width: 100%; aspect-ratio: 1/1; background: linear-gradient(135deg, #001a3a, #002D62); display: flex; align-items: center; justify-content: center; }
    .initial { font-size: 80px; font-weight: 700; color: rgba(255,255,255,0.15); }
    .brand { margin-top: auto; padding-top: 32px; font-size: 11px; color: rgba(255,255,255,0.2); text-align: center; letter-spacing: 1px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="card">
        <div className="photo-zone">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={user.full_name} />
          ) : (
            <div className="no-photo">
              <span className="initial">{user.full_name?.charAt(0) || '?'}</span>
            </div>
          )}
          <div className="photo-gradient" />
        </div>
        <div className="action-zone">
          <div className="name">{user.full_name}</div>
          {profile?.job_title && (
            <div className="title">{profile.job_title}</div>
          )}
          <a className="save-btn" href={'data:text/vcard;base64,' + vcardBase64} download={username + '.vcf'}>Save Contact</a>
          <a className="telecard-btn" href={botUrl}>Get your own TeleCard</a>
          <div className="brand">TELECARD</div>
        </div>
      </div>
    </>
  )
}