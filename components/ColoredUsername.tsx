import { User } from "@/models/types"

interface Props {
    user: User;
}

const ColoredUserName: React.FC<Props> = ({ user }) => {
    return <>{user.name}</>;
};


export default ColoredUserName; 
