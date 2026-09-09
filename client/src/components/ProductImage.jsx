import { FiImage } from "react-icons/fi";

export default function ProductImage({ src, alt, className = "" }) {
  if (!src) return <div className={`product-image-placeholder ${className}`}><FiImage /><span>No image</span></div>;
  return <img className={className} src={src} alt={alt || "Product"} loading="lazy" />;
}
