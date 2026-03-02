import { ShowView } from '@/components/refine-ui/views/show-view';
import { useParams } from 'react-router';

const ShowUser = () => {
  const { id } = useParams();
  return (
    <ShowView>ShowUser with ID: {id}</ShowView>
  )
}

export default ShowUser