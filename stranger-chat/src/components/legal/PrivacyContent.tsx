import { siteConfig } from "./siteConfig";

export default function PrivacyContent() {
  return (
    <>
      <p>
        {siteConfig.name} mein tumhari privacy zaroori hai. Ye page batata hai ki hum kya jaankari use karte hain aur
        kyun.
      </p>

      <h2>1. Hum kya collect karte hain</h2>
      <ul>
        <li>
          <strong>Account jaankari:</strong> koi nahi. Sign-up nahi hai, to naam, email ya password nahi liya jata.
        </li>
        <li>
          <strong>Chat content:</strong> text messages sirf baat kar rahe dono browsers mein {siteConfig.retentionHours}{" "}
          ghante tak rehte hain, phir apne aap delete ho jate hain. Ye hamare server se nahi guzarte.
        </li>
        <li>
          <strong>Technical jaankari:</strong> connection banane ke liye signaling server se kuch technical data
          guzarta hai. Peer-to-peer connection mein dusre user ka browser tumhara IP address dekh sakta hai. Ye
          WebRTC technology ka hissa hai.
        </li>
        <li>
          <strong>Report data:</strong> jab koi kisi ko report karta hai, to safety review ke liye zaroori jaankari
          rakhi ja sakti hai.
        </li>
      </ul>

      <h2>2. Browser storage</h2>
      <p>
        Hum tumhare browser mein chhoti si setting (jaise 18+ confirmation) save karte hain taaki baar baar na poochna
        pade. Browser settings se tum ise kabhi bhi hata sakte ho.
      </p>

      <h2>3. Cookies aur advertising</h2>
      <p>
        Hum advertising ke liye Google AdSense jaise third-party vendors use kar sakte hain. Ye vendors cookies ya
        similar technology se tumhari pichli visits ke aadhar par ads dikha sakte hain. Tum{" "}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
          Google Ads Settings
        </a>{" "}
        par personalised ads band kar sakte ho, ya{" "}
        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
          aboutads.info
        </a>{" "}
        par third-party vendors ke cookies se opt-out kar sakte ho.
      </p>

      <h2>4. Hum jaankari kyun use karte hain</h2>
      <ul>
        <li>Chat connection banane aur chalane ke liye.</li>
        <li>Abuse aur spam rokne ke liye.</li>
        <li>Service behtar banane ke liye.</li>
      </ul>

      <h2>5. Sharing</h2>
      <p>
        Hum tumhari jaankari bechte nahi. Kanoon ya kisi vaidh adesh ke chalte, ya logon ki suraksha ke liye zaroori
        hone par jaankari saajha ki ja sakti hai.
      </p>

      <h2>6. Bachche</h2>
      <p>
        Service {siteConfig.minAge} saal se kam umar ke logon ke liye nahi hai. Agar tumhe lagta hai ki koi nabaalig
        service use kar raha hai, to turant humein batao.
      </p>

      <h2>7. Tumhare options</h2>
      <ul>
        <li>Browser data clear karke local storage hata sakte ho.</li>
        <li>Kisi bhi user ko block ya report kar sakte ho.</li>
        <li>Privacy se jude sawal ke liye humse sampark kar sakte ho.</li>
      </ul>

      <h2>8. Badlav</h2>
      <p>Hum ye policy badal sakte hain. Naya version isi page par upar di gayi date ke saath dikhega.</p>

      <h2>9. Contact</h2>
      <p>
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> par likho, ya <a href="/contact">Contact</a> page
        dekho.
      </p>
    </>
  );
}