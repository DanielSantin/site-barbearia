// hooks/useStrikes.js
import { useState } from "react";

export const useStrikes = () => {
  const [userStrikes, setUserStrikes] = useState(0);
  
  const updateStrikes = (strikes) => {
    if (strikes !== undefined && strikes !== null) {
      setUserStrikes(strikes);
    }
  };
  
  return {
    userStrikes,
    updateStrikes
  };
};