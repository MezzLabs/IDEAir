class FOO {
	struct BOOK;
	BOOK* m_book;
	FOO();
};

struct FOO::BOOK { 
	char * title;
	int price;
};
FOO::FOO() { char *t = m_book->title; }		
int main()
{
    FOO *p;
}
