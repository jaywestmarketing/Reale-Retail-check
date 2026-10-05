CXX = g++
CXXFLAGS = -O3 -fPIC -Wall -std=c++17

all: libprice_analytics.so price_analytics_bin

libprice_analytics.so: price_analytics.cpp price_analytics.hpp
	$(CXX) $(CXXFLAGS) -shared -o libprice_analytics.so price_analytics.cpp

price_analytics_bin: price_analytics.cpp price_analytics.hpp
	$(CXX) $(CXXFLAGS) -DCOMPILE_STANDALONE_CLI -o price_analytics_bin price_analytics.cpp

clean:
	rm -f libprice_analytics.so price_analytics_bin *.o

.PHONY: all clean
