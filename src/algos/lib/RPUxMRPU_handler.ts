import areRPUandMRPUEqual from "../../apis/backend/userPrefs/areRPUandMRPUEqual";
import incrementRPU from "../../apis/backend/userPrefs/incrementRPU";
import { useUserData } from "../../stores";


export async function PRUxMRPU_handler() {

    const { setUpdateUserData, updateUserData } = useUserData.getState();

    try {
        const res = await areRPUandMRPUEqual();

        if (res === 'not equal') {
            // Update RPU (Request per user) number by increasing it by 1
            async function incrementRPUHandler() {
                const res = await incrementRPU();
                if (res === true) {
                    setUpdateUserData(!updateUserData)
                    return true;
                } else {
                    return false;
                }
            }
            // Call the incrementRPU function
            incrementRPUHandler();
        } else if (res === 'equal') {
            return 'limitWarning';
        } else {
            console.error('Unexpected result when comparing RPU and MRPU:', res);
        }
    } catch (error) {
        console.error('Error occurred during RPU check/increment:', error);
    }
}

export default PRUxMRPU_handler;