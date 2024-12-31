import { SocialIcon } from "react-social-icons";
function Footer() {
  return (
    <footer className="text-white">
      <hr className="border-gray-700 mt-4 py-2" />

      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="w-full text-center">
            <ul className="contact-list space-y-2">
              <li className="text-lg font-bold">Piers Sinclair</li>
              <li className="text-sm">Lead Software Engineer</li>
            </ul>
          </div>

          <div className="social-links mt-4 flex justify-center w-full space-x-4">
            <SocialIcon bgColor="transparent" url="https://www.linkedin.com/in/piers-sinclair" />
            <SocialIcon bgColor="transparent" url="https://github.com/piers-sinclair" />
            <SocialIcon bgColor="transparent" url="https://x.com/SinclairPiers" />
            <SocialIcon bgColor="transparent" network="rss" url="/feed.xml" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;