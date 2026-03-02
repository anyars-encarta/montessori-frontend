import { ShowView } from '@/components/refine-ui/views/show-view';
import { useParams } from 'react-router';

const ShowStudent = () => {
  const { id } = useParams();
  return (
    <ShowView>ShowStudent with ID: {id}</ShowView>
  )
}

export default ShowStudent