import { useEffect, useState } from 'react';
import apartmentImage from '../assets/images/property-apartment-islamabad.png';
import houseImage from '../assets/images/property-house-interior.png';
import officeImage from '../assets/images/property-office-pakistan.png';
import studioImage from '../assets/images/property-room-studio.png';
import defaultPropertyImage from '../assets/images/property-shop-exterior.png';

const fallbackImages = Object.freeze({
  apartment: apartmentImage,
  house: houseImage,
  villa: houseImage,
  office: officeImage,
  studio: studioImage,
});

function PropertyImage({ property, className }) {
  const fallbackImage =
    fallbackImages[property.propertyType] || defaultPropertyImage;
  const [imageSource, setImageSource] = useState(
    property.imageUrl || fallbackImage,
  );

  useEffect(() => {
    setImageSource(property.imageUrl || fallbackImage);
  }, [fallbackImage, property.imageUrl]);

  return (
    <img
      className={className}
      src={imageSource}
      alt={`${property.title} in ${property.city}`}
      onError={() => setImageSource(fallbackImage)}
    />
  );
}

export default PropertyImage;
