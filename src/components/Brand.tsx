import { Beer } from 'lucide-react'

export default function Brand() {
  return <a className="brand" href="#top" aria-label="Beer BROS home"><span className="brand-mark"><Beer size={19} strokeWidth={2.2} /></span><span>beer<span className="brand-bros">BROS</span></span></a>
}
