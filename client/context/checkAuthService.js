import axios from "axios";
import Cookies from "js-cookie";

export const checkAuthService = async () => {
  try {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/user/check-auth`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return { success: false };
  }
};
