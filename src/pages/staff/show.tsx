import { ShowView } from '@/components/refine-ui/views/show-view';
import { useParams } from 'react-router';

const ShowStaff = () => {
  const { id } = useParams();
  return (
    <ShowView>ShowStaff with ID: {id}</ShowView>
  )
}

export default ShowStaff