import { FaUser, FaUsers, FaPeopleCarry, FaUserFriends, FaHeart, FaPlaceOfWorship } from "react-icons/fa";

export const SelectBudgetOptions = [
  {
    id: 1,
    title: "Just Me",
    desc: "Solo travels in exploration",
    icon: FaUser,
    people: "1",
  },
  {
    id: 2,
    title: "With Friends",
    desc: "Group travels for adventure",
    icon: FaUserFriends,
    people: "5-10",
  },
  {
    id: 3,
    title: "With Family",
    desc: "Family travels for bonding",
    icon: FaPeopleCarry,
    people: "5-8",
  },
  {
    id: 4,
    title: "With Colleagues",
    desc: "Business travels for work",
    icon: FaUsers,
    people: "9-12",
  },
  {
    id: 5,
    title: "Couples",
    desc: "Travel with your beloved ones",
    icon: FaHeart,
    people: "2",
  },
  {
    id: 6,
    title: "Religious travel",
    desc: "Travel for religious purposes",
    icon: FaPlaceOfWorship,
    people: "15-20",
  },
];