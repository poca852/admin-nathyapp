export const getDate = (date: string): Date => {

   let dateSlice = date.split('/');

   let day = parseInt(dateSlice[0], 10);
   let month = parseInt(dateSlice[1], 10) - 1;
   let year = parseInt(dateSlice[2], 10);

   return new Date(year, month, day);

}