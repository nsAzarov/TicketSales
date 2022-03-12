import { Box, Button } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { ApiService } from '../../Services';

export const Main = () => {
  const [time, setTime] = useState(undefined);
  const [multiplicator, setMultiplicator] = useState(undefined);
  const api = useMemo(() => new ApiService(), []);

  const buyTickets = useCallback(() => {
    api.buyTickets(10);
  }, [api]);

  return (
    <Box sx={{ maxWidth: '70%', margin: '100px auto' }}>
      <Button onClick={buyTickets}>asdf</Button>
    </Box>
  );
};
