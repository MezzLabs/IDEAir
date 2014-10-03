#CC = gcc
#XX = g++
#CFLAGS = -Wall -O -g
#TARGET = ./helloworld
#DIR_INC = ./include
#DIR_SRC = ./src
#DIR_OBJ = ./obj
#DIR_BIN = ./bin

SRCS:=
OBJS:=$(SRCS:.c=.o)
TARGET:= ./$(DIR_BIN)/$(Mainfile)
SOURCES = $(wildcard *.c *.cpp)
OBJS = $(patsubst %.c,${DIR_BIN}/%.o,$(patsubst %.cpp,%.o,$(SOURCES)))

$(TARGET): chkbindir $(OBJS)
	$(CC) $(OBJS) -o $(TARGET)
	chmod a+x $(TARGET)
	
${DIR_BIN}/%.o: %.c
	$(CC) $(CFLAGS) -c  $< -o $@

clean:
	find ${DIR_BIN} -name *.o -exec rm -rf {}

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
%.o:%.cpp
	$(XX) $(CFLAGS) -c $< -o $@
	
chkbindir:
	@if test ! -d $(DIR_BIN) ; \
	then \
		mkdir $(DIR_BIN) ; \
	fi
	
print:
	@echo $(OBJS)

LIB_TARGET:=libtest.a
$(LIB_TARGET):$(OBJS)
	ar rcs $@ $^
	
