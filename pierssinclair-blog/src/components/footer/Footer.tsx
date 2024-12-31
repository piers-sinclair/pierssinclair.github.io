import { SocialIcon } from "react-social-icons";

function Footer() {
  return (
    <footer className="text-white">
      <hr className="border-gray-700 mt-4 py-2" />

      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="w-1/2">
            <ul className="contact-list space-y-2">
              <li className="text-lg font-bold">Piers Sinclair</li>
              <li className="text-sm">Lead Software Engineer</li>
            </ul>
          </div>
          <div className="w-1/2 text-right">
            <p className="feed-subscribe">
              <a href="/feed.xml" className="flex items-center justify-end space-x-2">
                <svg className="w-6 h-6 text-orange-500">
                  <use xlinkHref="/assets/minima-social-icons.svg#rss"></use>
                </svg>
                <span>Subscribe</span>
              </a>
            </p>
          </div>
        </div>

        <div className="social-links mt-4 flex justify-center space-x-4">
          <SocialIcon bgColor="transparent" url="https://www.linkedin.com/in/piers-sinclair" />
          <SocialIcon bgColor="transparent" url="https://github.com/piers-sinclair" />
          <SocialIcon bgColor="transparent" url="https://x.com/SinclairPiers" />
        </div>
      </div>
    </footer>
  );
}

export default Footer;