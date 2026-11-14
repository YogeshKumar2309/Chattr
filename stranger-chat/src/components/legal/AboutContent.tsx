import { siteConfig } from "./siteConfig";

export default function AboutContent() {
  return (
    <>
      <p>
        {siteConfig.name} ek free random chat platform hai jahan tum bina sign-up kiye kisi anjaan insaan se text,
        audio ya video par baat kar sakte ho. Na account banana, na email dena.
      </p>

      <h2>Hum ye kyun bana rahe hain</h2>
      <p>
        Naye logon se baat karna achha lagta hai, lekin zyadatar apps pehle poori jaankari maangte hain. Hum chahte
        the ki baat shuru karne mein ek click lage, aur tumhari privacy tumhare haath mein rahe.
      </p>

      <h2>Ye kaise kaam karta hai</h2>
      <ul>
        <li>Tum mode chunte ho (text, audio ya video) aur 18+ confirm karte ho.</li>
        <li>Hum tumhe kisi aur online user se match karte hain.</li>
        <li>
          Baat seedha dono browsers ke beech hoti hai (peer-to-peer). Tumhare messages hamare server se nahi
          guzarte.
        </li>
        <li>
          Messages dono browsers mein sirf {siteConfig.retentionHours} ghante rehte hain, phir apne aap delete ho
          jate hain.
        </li>
      </ul>

      <h2>Safety</h2>
      <p>
        Kisi ko bhi report ya block kiya ja sakta hai. {siteConfig.name} {siteConfig.minAge} saal ya usse bade logon
        ke liye hai. Video chat mein apna naam, address, phone number ya koi personal jaankari share mat karo. Aur
        jaankari ke liye hamara <a href="/privacy">Privacy Policy</a> aur <a href="/terms">Terms</a> padho.
      </p>

      <h2>Humse baat karo</h2>
      <p>
        Suggestion, bug ya complaint ho to <a href="/contact">Contact</a> page par likho ya seedha{" "}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> par mail karo.
      </p>
    </>
  );
}