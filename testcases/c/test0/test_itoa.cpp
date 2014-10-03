#include <stdio.h>
#include <stdlib.h>
 int x;
int main ()
{
  int i;
  i = x;
  char buffer [33];
  printf ("Enter a number: ");
  scanf ("%d",&i);
  bb
  //itoa (i,buffer,10);
  printf ("decimal: %s\n",buffer);
  //itoa (i,buffer,16);
  printf ("hexadecimal: %s\n",buffer);
  //itoa (i,buffer,2);
  printf ("binary: %s\n",buffer);
  return 0;
}
