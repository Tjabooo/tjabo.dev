import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LanguageSwitcher() {
  const router = useRouter();
  const { locale, locales, asPath } = router;

  return (
    <div className="text-sm text-[#8839ef] font-medium ml-1">
      {locales.map((lng, idx) => (
        <span key={lng}>
          <Link href={asPath} locale={lng}>
            <span className={locale === lng ? 'font-bold' : 'font-normal'}>
              {lng.toUpperCase()}
            </span>
          </Link>
          {idx < locales.length - 1 && ' | '}
        </span>
      ))}
    </div>
  )
}
