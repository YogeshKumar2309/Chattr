import { siteConfig } from "./siteConfig";

export default function ContactContent() {
  return (
    <>
      <p>Sawal, suggestion, bug ya complaint ho to humein likho. Hum jaldi se jaldi jawab dene ki koshish karte hain.</p>

      <h2>General support</h2>
      <p>
        Email: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
      </p>

      <h2>Abuse report karna</h2>
      <p>
        Chat ke dauraan kisi ko report kar sakte ho. Agar koi gambhir matter hai, to email mein ye likho: kya hua, kab
        hua, aur (agar ho) screenshot. Personal jaankari zyada mat bhejo.
      </p>

      <h2>Grievance Officer</h2>
      <p>
        Naam: {siteConfig.grievanceOfficer.name}
        <br />
        Email: <a href={`mailto:${siteConfig.grievanceOfficer.email}`}>{siteConfig.grievanceOfficer.email}</a>
      </p>

      <h2>Privacy se jude sawal</h2>
      <p>
        Dekho: <a href="/privacy">Privacy Policy</a>
      </p>
    </>
  );
}